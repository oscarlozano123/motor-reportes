const queueService = require('../services/queue.service');
const jobModel = require('../models/job.model');
const { generarLinkFirmado } = require('../services/signedLink.service');
const { obtenerUsoRecursos, obtenerHistorialRecursos } = require('../services/resourceMonitor.service');
const { ejecutarLimpieza } = require('../services/cleanup.service');

// Prioridades: el número se guarda en la base y el worker toma primero las más altas
const PRIORIDADES = { baja: 0, normal: 1, alta: 2 };
const NOMBRES_PRIORIDAD = ['baja', 'normal', 'alta'];

// POST /api/reportes — encola un nuevo reporte (no lo genera aquí, eso lo hace el worker)
async function crearReporte(req, res) {
    try {
        const { tipo, titulo, filas, columnas, prioridad = 'normal' } = req.body;

        if (!tipo || !['pdf', 'excel'].includes(tipo)) {
            return res.status(400).json({ error: "El campo 'tipo' debe ser 'pdf' o 'excel'" });
        }
        if (!titulo) {
            return res.status(400).json({ error: "El campo 'titulo' es obligatorio" });
        }

        if (!(prioridad in PRIORIDADES)) {
            return res.status(400).json({ error: "El campo 'prioridad' debe ser 'baja', 'normal' o 'alta'" });
        }

        const payload = { titulo, filas, columnas };
        const job = await queueService.encolarReporte(tipo, titulo, payload, PRIORIDADES[prioridad]);

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
        prioridad: NOMBRES_PRIORIDAD[job.prioridad] || 'normal',
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

// POST /api/reportes/:id/cancelar — cancela un reporte que todavía está pendiente
async function cancelarReporte(req, res) {
    try {
        const id = Number(req.params.id);
        const cancelado = await jobModel.cancelarJob(id);

        if (cancelado) {
            return res.json(armarRespuestaJob(cancelado));
        }

        // No se pudo cancelar: o no existe, o ya no estaba pendiente
        const job = await jobModel.obtenerJobPorId(id);
        if (!job) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }
        res.status(409).json({
            error: `No se puede cancelar: el reporte está en estado '${job.estado}'. Solo se cancelan los pendientes.`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cancelar el reporte' });
    }
}

// GET /api/recursos — estado actual de CPU/RAM del servidor
function consultarRecursos(req, res) {
    res.json(obtenerUsoRecursos());
}

// GET /api/recursos/historial — últimas lecturas de CPU/RAM (para la gráfica)
function consultarHistorialRecursos(req, res) {
    res.json(obtenerHistorialRecursos());
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
    cancelarReporte,
    consultarRecursos,
    consultarHistorialRecursos,
    ejecutarLimpiezaManual
};
