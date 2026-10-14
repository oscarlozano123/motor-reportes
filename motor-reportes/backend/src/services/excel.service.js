const ExcelJS = require('exceljs');
const path = require('path');

const CARPETA_STORAGE = path.join(__dirname, '..', '..', 'storage');

// Genera un Excel "denso" (muchas filas) a partir del payload del job.
// payload esperado: { titulo: string, filas: number, columnas: string[] }
async function generarExcel(jobId, payload) {
    const nombreArchivo = `reporte-${jobId}.xlsx`;
    const rutaCompleta = path.join(CARPETA_STORAGE, nombreArchivo);

    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet(payload.titulo || 'Reporte');

    const columnas = payload.columnas && payload.columnas.length
        ? payload.columnas
        : ['Columna A', 'Columna B', 'Columna C'];

    hoja.columns = columnas.map((nombre) => ({ header: nombre, key: nombre, width: 20 }));
    hoja.getRow(1).font = { bold: true };

    const filas = Math.min(Number(payload.filas) || 100, 20000); // tope de seguridad

    // Reporte denso: muchas filas, igual que en el PDF
    for (let i = 1; i <= filas; i++) {
        const fila = {};
        columnas.forEach((c) => { fila[c] = `${c}-${i}`; });
        hoja.addRow(fila);
    }

    await workbook.xlsx.writeFile(rutaCompleta);
    return rutaCompleta;
}

module.exports = { generarExcel };
