const ExcelJS = require('exceljs');
const path = require('path');
const { TAMANO_LOTE, cederTurno } = require('./progreso.helper');
const { prepararDatos, describirFiltros } = require('./datos.service');

const CARPETA_STORAGE = path.join(__dirname, '..', '..', 'storage');

// Genera un Excel a partir del payload del job (datos simulados o ventas reales).
// onProgreso(pct) se llama a medida que avanza (0-99); el 100 lo marca el worker al terminar.
async function generarExcel(jobId, payload, onProgreso = () => {}) {
    const nombreArchivo = `reporte-${jobId}.xlsx`;
    const rutaCompleta = path.join(CARPETA_STORAGE, nombreArchivo);

    const datos = await prepararDatos('excel', payload);
    const esVentas = payload.fuente === 'ventas';

    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet((payload.titulo || 'Reporte').slice(0, 31));

    hoja.columns = datos.columnas.map((nombre) => ({ header: nombre, key: nombre, width: 20 }));
    hoja.getRow(1).font = { bold: true };

    if (esVentas) {
        // Los números como números (no texto) para que se puedan sumar en Excel
        ['Precio unitario', 'Total'].forEach((k) => {
            hoja.getColumn(k).numFmt = '"$"#,##0';
        });
    }

    const total = datos.filas.length;
    for (let i = 0; i < total; i++) {
        hoja.addRow(datos.filas[i]);

        if ((i + 1) % TAMANO_LOTE === 0 && i + 1 < total) {
            onProgreso(Math.min(99, Math.round(((i + 1) / total) * 100)));
            await cederTurno();
        }
    }

    if (esVentas) {
        const fila = hoja.addRow([]);
        fila.getCell(1).value = `${total} ventas — ${describirFiltros(datos.filtros)}`;
        fila.getCell(datos.columnaTotal + 1).value = datos.sumaTotal;
        fila.getCell(datos.columnaTotal + 1).numFmt = '"$"#,##0';
        fila.font = { bold: true };
    }

    await workbook.xlsx.writeFile(rutaCompleta);
    return rutaCompleta;
}

module.exports = { generarExcel };
