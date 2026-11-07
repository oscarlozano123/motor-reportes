const express = require('express');
const router = express.Router();
const controller = require('../controllers/report.controller');
const validarLinkFirmado = require('../middlewares/validarLinkFirmado');
const limitarPeticiones = require('../middlewares/limitarPeticiones');
const autenticar = require('../middlewares/autenticar');

/**
 * @openapi
 * /api/reportes:
 *   post:
 *     summary: Encola un nuevo reporte (PDF o Excel) para ser generado por el worker
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo, titulo]
 *             properties:
 *               tipo: { type: string, enum: [pdf, excel] }
 *               prioridad: { type: string, enum: [baja, normal, alta], default: normal }
 *               fuente: { type: string, enum: [simulado, ventas], default: simulado, description: "'ventas' usa la tabla de ventas reales" }
 *               filtros:
 *                 type: object
 *                 description: Solo para fuente ventas
 *                 properties:
 *                   desde: { type: string, example: "2026-03-01" }
 *                   hasta: { type: string, example: "2026-03-31" }
 *                   categoria: { type: string, example: Tecnología }
 *               titulo: { type: string }
 *               filas: { type: integer, example: 500 }
 *               columnas: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Reporte encolado }
 *       401: { description: Sin sesión }
 *       429: { description: Demasiadas solicitudes (límite por IP) }
 */
router.post('/', autenticar, limitarPeticiones, controller.crearReporte);

/**
 * @openapi
 * /api/reportes:
 *   get:
 *     summary: Historial de TUS reportes (los más recientes primero)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 50, maximum: 200 }
 *     responses:
 *       200: { description: Lista de reportes con estado, progreso e intentos }
 */
router.get('/', autenticar, controller.listarReportes);

/**
 * @openapi
 * /api/reportes/{id}:
 *   get:
 *     summary: Consulta el estado de uno de tus reportes
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Estado del reporte }
 *       404: { description: No encontrado }
 */
router.get('/:id', autenticar, controller.consultarReporte);

/**
 * @openapi
 * /api/reportes/{id}/descargar:
 *   get:
 *     summary: Descarga el archivo generado, usando un enlace temporal firmado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Archivo descargado }
 *       403: { description: Enlace inválido o expirado }
 */
router.get('/:id/descargar', validarLinkFirmado, controller.descargarReporte);

/**
 * @openapi
 * /api/reportes/{id}/cancelar:
 *   post:
 *     summary: Cancela un reporte que todavía está pendiente (no se puede cancelar uno en proceso)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Reporte cancelado }
 *       404: { description: No encontrado }
 *       409: { description: El reporte ya no estaba pendiente }
 */
router.post('/:id/cancelar', autenticar, controller.cancelarReporte);

module.exports = router;
