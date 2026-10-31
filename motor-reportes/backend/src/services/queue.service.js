const jobModel = require('../models/job.model');

// Encola un nuevo trabajo de generación de reporte
<<<<<<< HEAD
async function encolarReporte(tipo, titulo, payload, prioridad = 1) {
    const job = await jobModel.crearJob(tipo, titulo, payload, prioridad);
=======
async function encolarReporte(tipo, titulo, payload) {
    const job = await jobModel.crearJob(tipo, titulo, payload);
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
    return job;
}

async function consultarEstado(id) {
    return jobModel.obtenerJobPorId(id);
}

module.exports = { encolarReporte, consultarEstado };
