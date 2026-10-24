require('dotenv').config();

// Los reportes se generan por lotes de filas. Entre lote y lote cedemos el turno
// al event loop para que el worker pueda guardar el progreso en la base de datos.
const TAMANO_LOTE = 250;

// Para demos: RETARDO_LOTE_MS=300 hace que cada lote tarde 300 ms extra, y así
// el reporte "pesa" lo suficiente para ver la barra de progreso avanzar.
const RETARDO_LOTE_MS = Number(process.env.RETARDO_LOTE_MS || 0);

function cederTurno() {
    return new Promise((resolve) => {
        if (RETARDO_LOTE_MS > 0) setTimeout(resolve, RETARDO_LOTE_MS);
        else setImmediate(resolve);
    });
}

module.exports = { TAMANO_LOTE, cederTurno };
