const ventaModel = require('../models/venta.model');
const { validarFiltros } = require('./report.controller');

// GET /api/ventas/categorias — para llenar el selector del formulario
async function listarCategorias(req, res) {
    try {
        res.json(await ventaModel.listarCategorias());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar las categorías' });
    }
}

// GET /api/ventas/resumen?desde=&hasta=&categoria= — cuántas filas y qué suma tendría el reporte
async function resumir(req, res) {
    try {
        const { filtros, error } = validarFiltros(req.query);
        if (error) return res.status(400).json({ error });
        res.json(await ventaModel.resumenVentas(filtros));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al calcular el resumen' });
    }
}

module.exports = { listarCategorias, resumir };
