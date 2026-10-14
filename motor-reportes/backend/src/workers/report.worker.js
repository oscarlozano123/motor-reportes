// Worker desacoplado: se corre como un PROCESO APARTE del API (con "npm run worker").
// Hace polling a la base de datos buscando jobs pendientes y los procesa uno por uno,
// respetando el uso de CPU/RAM antes de tomar trabajo nuevo.

const jobModel = require('../models/job.model');
const { hayRecursosDisponibles } = require('../services/resourceMonitor.service');
const { generarPdf } = require('../services/pdf.service');
const { generarExcel } = require('../services/excel.service');

const INTERVALO_POLLING_MS = 3000;
let procesando = false;

async function procesarUnJob(job) {
    console.log(`→ Procesando job #${job.id} (${job.tipo}) "${job.titulo}"`);
    try {
        const ruta = job.tipo === 'pdf'
            ? await generarPdf(job.id, job.payload)
            : await generarExcel(job.id, job.payload);

        await jobModel.marcarJobComoTerminado(job.id, ruta);
        console.log(`✔ Job #${job.id} terminado → ${ruta}`);
    } catch (error) {
        await jobModel.marcarJobComoFallido(job.id, error.message);
        console.error(`✘ Job #${job.id} falló:`, error.message);
    }
}

async function cicloDeTrabajo() {
    if (procesando) return; // evita solaparse si un job tarda más que el intervalo

    if (!hayRecursosDisponibles()) {
        console.log('⏸ CPU/RAM por encima del umbral, esperando el próximo ciclo...');
        return;
    }

    const job = await jobModel.tomarSiguienteJobPendiente();
    if (!job) return; // nada pendiente

    procesando = true;
    await procesarUnJob(job);
    procesando = false;
}

console.log('🚀 Worker de reportes iniciado. Esperando trabajos...');
setInterval(cicloDeTrabajo, INTERVALO_POLLING_MS);
