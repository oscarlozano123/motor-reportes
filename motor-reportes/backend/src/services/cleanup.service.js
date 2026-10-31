const cron = require('node-cron');
const fs = require('fs');
const jobModel = require('../models/job.model');
require('dotenv').config();

// Retención por defecto: HORAS_RETENCION (24 h). Para pruebas/demos puedes poner
// MINUTOS_RETENCION=1 en el .env y tiene prioridad sobre las horas.
const MINUTOS_RETENCION = process.env.MINUTOS_RETENCION
    ? Number(process.env.MINUTOS_RETENCION)
    : Number(process.env.HORAS_RETENCION || 24) * 60;

// Borra los archivos y las filas de reportes terminados hace más de `minutos`.
// Devuelve cuántos eliminó, para poder mostrarlo (por ejemplo desde el frontend).
async function ejecutarLimpieza(minutos = MINUTOS_RETENCION) {
    const vencidos = await jobModel.obtenerJobsVencidos(minutos);

    if (vencidos.length === 0) {
        console.log('[GC] Nada que limpiar.');
        return { eliminados: 0, archivosBorrados: 0, minutos };
    }

    let archivosBorrados = 0;
    for (const job of vencidos) {
        if (job.ruta_resultado && fs.existsSync(job.ruta_resultado)) {
            fs.unlinkSync(job.ruta_resultado);
            archivosBorrados++;
        }
    }

    await jobModel.eliminarJobsPorIds(vencidos.map((j) => j.id));
    console.log(`[GC] ${vencidos.length} reporte(s) eliminado(s), ${archivosBorrados} archivo(s) borrado(s).`);
    return { eliminados: vencidos.length, archivosBorrados, minutos };
}

// Recolección de basura: corre cada hora, borra archivos y filas viejas
function iniciarRecoleccionDeBasura() {
    cron.schedule('0 * * * *', () => {
        ejecutarLimpieza().catch((e) => console.error('[GC] Error:', e.message));
    }); // minuto 0 de cada hora
    console.log(`[GC] Programado: limpia reportes de más de ${MINUTOS_RETENCION} minuto(s), cada hora.`);
}

module.exports = { iniciarRecoleccionDeBasura, ejecutarLimpieza, MINUTOS_RETENCION };
