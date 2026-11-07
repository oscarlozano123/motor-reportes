const pool = require('../config/db');

// Condición común de filtros: fechas (inclusive) y categoría. NULL = sin filtrar.
const FILTROS = `
    ($1::date IS NULL OR fecha >= $1::date)
    AND ($2::date IS NULL OR fecha <= $2::date)
    AND ($3::text IS NULL OR categoria = $3::text)`;

function params({ desde, hasta, categoria }) {
    return [desde || null, hasta || null, categoria || null];
}

// Filas de ventas para el reporte (con tope de seguridad)
async function obtenerVentas(filtros, limite = 50000) {
    const { rows } = await pool.query(
        `SELECT to_char(fecha, 'YYYY-MM-DD') AS fecha, producto, categoria, cantidad,
                precio_unitario::float8 AS precio_unitario, total::float8 AS total
         FROM ventas
         WHERE ${FILTROS}
         ORDER BY fecha, id
         LIMIT $4`,
        [...params(filtros), limite]
    );
    return rows;
}

// Cuántas filas y qué suma devolvería un filtro (para mostrarlo antes de generar)
async function resumenVentas(filtros) {
    const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS filas, COALESCE(SUM(total), 0)::float8 AS total
         FROM ventas
         WHERE ${FILTROS}`,
        params(filtros)
    );
    return rows[0];
}

async function listarCategorias() {
    const { rows } = await pool.query('SELECT DISTINCT categoria FROM ventas ORDER BY categoria');
    return rows.map((r) => r.categoria);
}

async function contarVentas() {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM ventas');
    return rows[0].n;
}

// Inserta muchas ventas de golpe (usado por el seed)
async function insertarVentas(lista) {
    const valores = [];
    const marcas = lista.map((v, i) => {
        const b = i * 6;
        valores.push(v.fecha, v.producto, v.categoria, v.cantidad, v.precio_unitario, v.total);
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6})`;
    });
    await pool.query(
        `INSERT INTO ventas (fecha, producto, categoria, cantidad, precio_unitario, total)
         VALUES ${marcas.join(', ')}`,
        valores
    );
}

module.exports = { obtenerVentas, resumenVentas, listarCategorias, contarVentas, insertarVentas };
