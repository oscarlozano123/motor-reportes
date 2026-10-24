// Worker desacoplado: se corre como un PROCESO APARTE del API (con "npm run worker").
// Hace polling a la base de datos buscando jobs pendientes y los procesa uno por uno,
// respetando el uso de CPU/RAM antes de tomar trabajo nuevo.

require('dotenv').config();
const jobModel = require('../models/job.model');
const { hayRecursosDisponibles, obtenerUsoRecursos } = require('../services/resourceMonitor.service');
const { generarPdf } = require('../services/pdf.service');
const { generarExcel } = require('../services/excel.service');

const INTERVALO_POLLING_MS = 3000;
const MAX_INTENTOS = Number(process.env.MAX_INTENTOS || 3);
let procesando = false;

async function procesarUnJob(job) {
    console.log(`→ Procesando job #${job.id} (${job.tipo}) "${job.titulo}" [intento ${job.intentos + 1}/${MAX_INTENTOS}]`);
    try {
        // Gancho de pruebas: un título con la palabra "fallar" provoca un error a propósito,
        // para poder demostrar los reintentos automáticos.
        if (job.titulo.toLowerCase().includes('fallar')) {
            throw new Error('Fallo simulado (el título contiene "fallar")');
        }

        let ultimoPct = -1;
        const alProgresar = (pct) => {
            if (pct === ultimoPct) return;
            ultimoPct = pct;
            jobModel.actualizarProgreso(job.id, pct).catch(() => {});
        };

        const ruta = job.tipo === 'pdf'
            ? await generarPdf(job.id, job.payload, alProgresar)
            : await generarExcel(job.id, job.payload, alProgresar);

        await jobModel.marcarJobComoTerminado(job.id, ruta);
        console.log(`✔ Job #${job.id} terminado → ${ruta}`);
    } catch (error) {
        const resultado = await jobModel.registrarFallo(job.id, error.message, MAX_INTENTOS);
        if (resultado.estado === 'pending') {
            console.warn(`↻ Job #${job.id} falló (${error.message}). Intento ${resultado.intentos}/${MAX_INTENTOS}, se reintentará.`);
        } else {
            console.error(`✘ Job #${job.id} falló definitivamente tras ${resultado.intentos} intento(s): ${error.message}`);
        }
    }
}

async function cicloDeTrabajo() {
    if (procesando) return; // evita solaparse si un job tarda más que el intervalo

    try {
        if (!hayRecursosDisponibles()) {
            const { cpuPct, ramPct } = obtenerUsoRecursos();
            console.log(`⏸ Recursos altos (CPU ${cpuPct}% / RAM ${ramPct}%), esperando el próximo ciclo...`);
            return;
        }

        const job = await jobModel.tomarSiguienteJobPendiente();
        if (!job) return; // nada pendiente

        procesando = true;
        await procesarUnJob(job);
    } catch (error) {
        console.error('Error en el ciclo del worker:', error.message);
    } finally {
        procesando = false;
    }
}

console.log('🚀 Worker de reportes iniciado. Esperando trabajos...');
setInterval(cicloDeTrabajo, INTERVALO_POLLING_MS);
