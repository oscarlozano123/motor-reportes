// Prepara los datos de un reporte: de dónde salen las filas.
//  - fuente "simulado": filas inventadas (sirven para probar el peso del reporte)
//  - fuente "ventas":   filas reales de la tabla "ventas", con filtros por fecha y categoría
// Devuelve { columnas, filas, totales } y los generadores de PDF/Excel solo dibujan eso.
const ventaModel = require('../models/venta.model');

const TOPE_SIMULADO = { pdf: 5000, excel: 20000 };
const TOPE_VENTAS = { pdf: 5000, excel: 50000 };

async function prepararDatos(tipo, payload) {
    if (payload.fuente === 'ventas') {
        const ventas = await ventaModel.obtenerVentas(payload.filtros || {}, TOPE_VENTAS[tipo]);
        return {
            columnas: ['Fecha', 'Producto', 'Categoría', 'Cantidad', 'Precio unitario', 'Total'],
            filas: ventas.map((v) => [
                v.fecha, v.producto, v.categoria, v.cantidad, v.precio_unitario, v.total
            ]),
            // índice de la columna Total y suma, para la fila final del reporte
            columnaTotal: 5,
            sumaTotal: ventas.reduce((acc, v) => acc + v.total, 0),
            filtros: payload.filtros || {}
        };
    }

    const columnas = payload.columnas && payload.columnas.length
        ? payload.columnas
        : ['Columna A', 'Columna B', 'Columna C'];
    const cantidad = Math.min(Number(payload.filas) || 100, TOPE_SIMULADO[tipo]);
    const filas = [];
    for (let i = 1; i <= cantidad; i++) filas.push(columnas.map((c) => `${c}-${i}`));
    return { columnas, filas, columnaTotal: null, sumaTotal: null, filtros: {} };
}

// Texto que describe los filtros aplicados (para el encabezado del reporte)
function describirFiltros(filtros = {}) {
    const partes = [];
    if (filtros.desde) partes.push(`desde ${filtros.desde}`);
    if (filtros.hasta) partes.push(`hasta ${filtros.hasta}`);
    if (filtros.categoria) partes.push(`categoría ${filtros.categoria}`);
    return partes.length ? `Filtros: ${partes.join(', ')}` : 'Sin filtros (todas las ventas)';
}

module.exports = { prepararDatos, describirFiltros };
