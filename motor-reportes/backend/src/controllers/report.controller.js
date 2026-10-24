const queueService = require('../services/queue.service');
const jobModel = require('../models/job.model');
const { generarLinkFirmado } = require('../services/signedLink.service');
const { obtenerUsoRecursos } = require('../services/resourceMonitor.service');
const { ejecutarLimpieza } = require('../services/cleanup.service');

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
            progreso: job.progreso,
            mensaje: 'Reporte encolado. Consulta su estado con GET /api/reportes/:id'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al encolar el reporte' });
    }
}

// Convierte una fila de la base de datos en la respuesta pública del API
function armarRespuestaJob(job) {
    const respuesta = {
        id: job.id,
        tipo: job.tipo,
        titulo: job.titulo,
        estado: job.estado,
        progreso: job.progreso,
        intentos: job.intentos,
        creado_en: job.creado_en,
        actualizado_en: job.actualizado_en
    };

    if (job.estado === 'done') {
        respuesta.descarga = generarLinkFirmado(job.id);
    }
    // En 'failed' es el error definitivo; en 'pending' con intentos > 0 es el último
    // error, que explica por qué el job está siendo reintentado.
    if (job.estado === 'failed' || (job.estado === 'pending' && job.intentos > 0)) {
        respuesta.error = job.error_mensaje;
    }
    return respuesta;
}

// GET /api/reportes — historial de reportes (los más recientes primero)
async function listarReportes(req, res) {
    try {
        const limite = Math.min(Math.max(Number(req.query.limite) || 50, 1), 200);
        const jobs = await jobModel.listarJobs(limite);
        res.json(jobs.map(armarRespuestaJob));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar los reportes' });
    }
}

// GET /api/reportes/:id — estado actual del job, y link firmado si ya terminó
async function consultarReporte(req, res) {
    try {
        const job = await jobModel.obtenerJobPorId(req.params.id);

        if (!job) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        res.json(armarRespuestaJob(job));
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

        res.download(job.ruta_resultado, (err) => {
            // Si el archivo ya fue borrado por la limpieza, avisamos en vez de dejar colgado
            if (err && !res.headersSent) {
                res.status(404).json({ error: 'El archivo ya no existe (fue eliminado por la limpieza)' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al descargar el reporte' });
    }
}

// GET /api/recursos — estado actual de CPU/RAM del servidor
function consultarRecursos(req, res) {
    res.json(obtenerUsoRecursos());
}

// POST /api/mantenimiento/limpieza?minutos=N — ejecuta la recolección de basura ahora mismo.
// Sin "minutos" usa la retención configurada en el .env.
async function ejecutarLimpiezaManual(req, res) {
    try {
        let minutos;
        if (req.query.minutos !== undefined) {
            minutos = Number(req.query.minutos);
            if (!Number.isInteger(minutos) || minutos < 0) {
                return res.status(400).json({ error: "'minutos' debe ser un entero mayor o igual a 0" });
            }
        }
        const resultado = await ejecutarLimpieza(minutos);
        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al ejecutar la limpieza' });
    }
}

module.exports = {
    crearReporte,
    listarReportes,
    consultarReporte,
    descargarReporte,
    consultarRecursos,
    ejecutarLimpiezaManual
};
