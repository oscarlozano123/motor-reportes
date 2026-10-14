const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const CARPETA_STORAGE = path.join(__dirname, '..', '..', 'storage');

// Genera un PDF "denso" (muchas filas) a partir del payload del job.
// payload esperado: { titulo: string, filas: number, columnas: string[] }
function generarPdf(jobId, payload) {
    return new Promise((resolve, reject) => {
        const nombreArchivo = `reporte-${jobId}.pdf`;
        const rutaCompleta = path.join(CARPETA_STORAGE, nombreArchivo);

        const doc = new PDFDocument({ margin: 40 });
        const stream = fs.createWriteStream(rutaCompleta);
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
        }

        doc.end();

        stream.on('finish', () => resolve(rutaCompleta));
        stream.on('error', reject);
    });
}

module.exports = { generarPdf };
