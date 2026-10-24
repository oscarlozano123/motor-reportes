const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { TAMANO_LOTE, cederTurno } = require('./progreso.helper');

const CARPETA_STORAGE = path.join(__dirname, '..', '..', 'storage');

// Genera un PDF "denso" (muchas filas) a partir del payload del job.
// payload esperado: { titulo: string, filas: number, columnas: string[] }
// onProgreso(pct) se llama a medida que avanza (0-99); el 100 lo marca el worker al terminar.
async function generarPdf(jobId, payload, onProgreso = () => {}) {
    const nombreArchivo = `reporte-${jobId}.pdf`;
    const rutaCompleta = path.join(CARPETA_STORAGE, nombreArchivo);

    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(rutaCompleta);
    const terminado = new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(rutaCompleta));
        stream.on('error', reject);
    });
    doc.pipe(stream);

    doc.fontSize(18).text(payload.titulo || 'Reporte', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('gray')
        .text(`Generado el ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    const columnas = payload.columnas && payload.columnas.length
        ? payload.columnas
        : ['Columna A', 'Columna B', 'Columna C'];
    const filas = Math.min(Number(payload.filas) || 100, 5000); // tope de seguridad

    doc.fillColor('black').fontSize(11);

    // Encabezado de la "tabla"
    doc.font('Helvetica-Bold').text(columnas.join('   |   '));
    doc.moveDown(0.5);
    doc.font('Helvetica');

    // Simulamos un reporte denso con muchas filas (esto es lo que hace
    // pesada la tarea y justifica procesarla en un worker aparte)
    for (let i = 1; i <= filas; i++) {
        const valores = columnas.map((c) => `${c}-${i}`);
        doc.text(valores.join('   |   '));

        if (doc.y > 760) {
            doc.addPage();
        }

        if (i % TAMANO_LOTE === 0 && i < filas) {
            onProgreso(Math.min(99, Math.round((i / filas) * 100)));
            await cederTurno();
        }
    }

    doc.end();
    return terminado;
}

module.exports = { generarPdf };
