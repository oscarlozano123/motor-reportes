const queueService = require('../services/queue.service');
const jobModel = require('../models/job.model');
const { generarLinkFirmado } = require('../services/signedLink.service');
const { obtenerUsoRecursos } = require('../services/resourceMonitor.service');

// POST /api/reportes — encola un nuevo reporte (no lo genera aquí, eso lo hace el worker)
async function crearReporte(req, res) {
    try {
        const { tipo, titulo, filas, columnas } = req.body;

        if (!tipo || !['pdf', 'excel'].includes(tipo)) {
            return res.status(400).json({ error: "El campo 'tipo' debe ser 'pdf' o 'excel'" });
        }
        if (!titulo) {
            return res.status(400).json({ error: "El campo 'titulo' es obligatorio" });
        }

        const payload = { titulo, filas, columnas };
        const job = await queueService.encolarReporte(tipo, titulo, payload);

        res.status(201).json({
            id: job.id,
            estado: job.estado,
            mensaje: 'Reporte encolado. Consulta su estado con GET /api/reportes/:id'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al encolar el reporte' });
    }
}

// GET /api/reportes/:id — estado actual del job, y link firmado si ya terminó
async function consultarReporte(req, res) {
    try {
        const job = await jobModel.obtenerJobPorId(req.params.id);

        if (!job) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        const respuesta = {
            id: job.id,
            tipo: job.tipo,
            titulo: job.titulo,
            estado: job.estado,
            creado_en: job.creado_en
        };

        if (job.estado === 'done') {
            respuesta.descarga = generarLinkFirmado(job.id);
        }
        if (job.estado === 'failed') {
            respuesta.error = job.error_mensaje;
        }

        res.json(respuesta);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar el reporte' });
    }
}

// GET /api/reportes/:id/descargar?token=... — sirve el archivo ya generado
async function descargarReporte(req, res) {
    try {
        const job = await jobModel.obtenerJobPorId(req.params.id);

        if (!job || job.estado !== 'done' || !job.ruta_resultado) {
            return res.status(404).json({ error: 'El reporte no está disponible' });
        }

        res.download(job.ruta_resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al descargar el reporte' });
    }
}

// GET /api/recursos — estado actual de CPU/RAM del servidor
function consultarRecursos(req, res) {
    res.json(obtenerUsoRecursos());
}

module.exports = { crearReporte, consultarReporte, descargarReporte, consultarRecursos };
