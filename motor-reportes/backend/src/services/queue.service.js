const jobModel = require('../models/job.model');

// Encola un nuevo trabajo de generación de reporte
async function encolarReporte(tipo, titulo, payload) {
    const job = await jobModel.crearJob(tipo, titulo, payload);
    return job;
}

async function consultarEstado(id) {
    return jobModel.obtenerJobPorId(id);
}

module.exports = { encolarReporte, consultarEstado };
