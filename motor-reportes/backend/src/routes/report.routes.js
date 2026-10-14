const express = require('express');
const router = express.Router();
const controller = require('../controllers/report.controller');
const validarLinkFirmado = require('../middlewares/validarLinkFirmado');

/**
 * @openapi
 * /api/reportes:
 *   post:
 *     summary: Encola un nuevo reporte (PDF o Excel) para ser generado por el worker
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo, titulo]
 *             properties:
 *               tipo: { type: string, enum: [pdf, excel] }
 *               titulo: { type: string }
 *               filas: { type: integer, example: 500 }
 *               columnas: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Reporte encolado }
 */
router.post('/', controller.crearReporte);

/**
 * @openapi
 * /api/reportes/{id}:
 *   get:
 *     summary: Consulta el estado de un reporte encolado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Estado del reporte }
 *       404: { description: No encontrado }
 */
router.get('/:id', controller.consultarReporte);

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

module.exports = router;
