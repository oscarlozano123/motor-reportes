const jobModel = require('../models/job.model');

// Encola un nuevo trabajo de generación de reporte (a nombre de un usuario)
async function encolarReporte(tipo, titulo, payload, prioridad = 1, usuarioId = null) {
    const job = await jobModel.crearJob(tipo, titulo, payload, prioridad, usuarioId);
    return job;
}

async function consultarEstado(id) {
    return jobModel.obtenerJobPorId(id);
}

module.exports = { encolarReporte, consultarEstado };
