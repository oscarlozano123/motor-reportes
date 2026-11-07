const express = require('express');
const router = express.Router();
const controller = require('../controllers/ventas.controller');
const autenticar = require('../middlewares/autenticar');

router.use(autenticar);

/**
 * @openapi
 * /api/ventas/categorias:
 *   get:
 *     summary: Categorías de ventas disponibles para filtrar
 *     tags: [Ventas]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de categorías }
 */
router.get('/categorias', controller.listarCategorias);

/**
 * @openapi
 * /api/ventas/resumen:
 *   get:
 *     summary: Cuántas ventas y qué total tendría un reporte con esos filtros
 *     tags: [Ventas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: desde, schema: { type: string, example: "2026-03-01" } }
 *       - { in: query, name: hasta, schema: { type: string, example: "2026-03-31" } }
 *       - { in: query, name: categoria, schema: { type: string } }
 *     responses:
 *       200: { description: "{ filas, total }" }
 *       400: { description: Filtros inválidos }
 */
router.get('/resumen', controller.resumir);

module.exports = router;
