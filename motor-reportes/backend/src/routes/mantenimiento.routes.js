const express = require('express');
const router = express.Router();
const controller = require('../controllers/report.controller');

/**
 * @openapi
 * /api/mantenimiento/limpieza:
 *   post:
 *     summary: Ejecuta la recolección de basura ahora mismo (borra reportes viejos y sus archivos)
 *     parameters:
 *       - in: query
 *         name: minutos
 *         required: false
 *         description: Borra los reportes terminados hace más de estos minutos. Si se omite, usa la retención del .env.
 *         schema: { type: integer, minimum: 0, example: 1 }
 *     responses:
 *       200: { description: Cuántos reportes y archivos se eliminaron }
 *       400: { description: Parámetro inválido }
 */
router.post('/limpieza', controller.ejecutarLimpiezaManual);

module.exports = router;
