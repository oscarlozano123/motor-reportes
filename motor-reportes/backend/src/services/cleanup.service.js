const cron = require('node-cron');
const fs = require('fs');
const jobModel = require('../models/job.model');
require('dotenv').config();

const HORAS_RETENCION = Number(process.env.HORAS_RETENCION || 24);

async function ejecutarLimpieza() {
    const vencidos = await jobModel.obtenerJobsVencidos(HORAS_RETENCION);

    if (vencidos.length === 0) {
        console.log('[GC] Nada que limpiar.');
        return;
    }

    for (const job of vencidos) {
        if (job.ruta_resultado && fs.existsSync(job.ruta_resultado)) {
            fs.unlinkSync(job.ruta_resultado);
        }
    }

    await jobModel.eliminarJobsPorIds(vencidos.map((j) => j.id));
    console.log(`[GC] ${vencidos.length} reporte(s) eliminado(s).`);
}

// Recolección de basura: corre cada hora, borra archivos y filas viejas
function iniciarRecoleccionDeBasura() {
    cron.schedule('0 * * * *', ejecutarLimpieza); // minuto 0 de cada hora
    console.log(`[GC] Programado: limpia reportes de más de ${HORAS_RETENCION}h, cada hora.`);
}

module.exports = { iniciarRecoleccionDeBasura, ejecutarLimpieza };
