const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { TAMANO_LOTE, cederTurno } = require('./progreso.helper');
const { prepararDatos, describirFiltros } = require('./datos.service');

const CARPETA_STORAGE = path.join(__dirname, '..', '..', 'storage');
const MARGEN = 40;
const ALTO_FILA = 14;

const formatoDinero = (n) => `$${Number(n).toLocaleString('es-CO')}`;

// Genera un PDF a partir del payload del job (datos simulados o ventas reales).
// onProgreso(pct) se llama a medida que avanza (0-99); el 100 lo marca el worker al terminar.
async function generarPdf(jobId, payload, onProgreso = () => {}) {
    const nombreArchivo = `reporte-${jobId}.pdf`;
    const rutaCompleta = path.join(CARPETA_STORAGE, nombreArchivo);

    const datos = await prepararDatos('pdf', payload);
    const esVentas = payload.fuente === 'ventas';

    const doc = new PDFDocument({ margin: MARGEN });
    const stream = fs.createWriteStream(rutaCompleta);
    const terminado = new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(rutaCompleta));
        stream.on('error', reject);
    });
    doc.pipe(stream);

    doc.fontSize(18).text(payload.titulo || 'Reporte', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('gray')
        .text(`Generado el ${new Date().toLocaleString()}`, { align: 'center' });
    if (esVentas) doc.text(describirFiltros(datos.filtros), { align: 'center' });
    doc.moveDown(1.5);

    // Tabla con columnas de ancho fijo
    const anchoTotal = doc.page.width - MARGEN * 2;
    const ancho = anchoTotal / datos.columnas.length;
    const dibujarFila = (valores, negrita = false) => {
        if (doc.y > doc.page.height - MARGEN - ALTO_FILA) doc.addPage();
        const y = doc.y;
        doc.font(negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('black');
        valores.forEach((v, i) => {
            doc.text(String(v), MARGEN + i * ancho, y, { width: ancho - 4, lineBreak: false, ellipsis: true });
        });
        doc.y = y + ALTO_FILA;
        doc.x = MARGEN;
    };

    dibujarFila(datos.columnas, true);

    const total = datos.filas.length;
    for (let i = 0; i < total; i++) {
        // En ventas, las columnas de precio y total (4 y 5) se muestran como dinero
        const fila = datos.filas[i].map((v, c) => (esVentas && c >= 4 ? formatoDinero(v) : v));
        dibujarFila(fila);

        if ((i + 1) % TAMANO_LOTE === 0 && i + 1 < total) {
            onProgreso(Math.min(99, Math.round(((i + 1) / total) * 100)));
            await cederTurno();
        }
    }

    if (esVentas) {
        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(11)
            .text(`${total} ventas — Total: ${formatoDinero(datos.sumaTotal)}`, MARGEN, doc.y);
    }

    doc.end();
    return terminado;
}

module.exports = { generarPdf };
