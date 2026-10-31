const jobModel = require('../models/job.model');

// Encola un nuevo trabajo de generación de reporte
async function encolarReporte(tipo, titulo, payload, prioridad = 1) {
    const job = await jobModel.crearJob(tipo, titulo, payload, prioridad);
    return job;
}

async function consultarEstado(id) {
    return jobModel.obtenerJobPorId(id);
}

module.exports = { encolarReporte, consultarEstado };
