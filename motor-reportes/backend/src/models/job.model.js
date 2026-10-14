const pool = require('../config/db');

// Crea un nuevo job en estado 'pending' y devuelve su fila completa
async function crearJob(tipo, titulo, payload) {
    const { rows } = await pool.query(
        `INSERT INTO jobs (tipo, titulo, payload)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [tipo, titulo, payload]
    );
    return rows[0];
}

// Busca un job por su id
async function obtenerJobPorId(id) {
    const { rows } = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    return rows[0];
}

// Toma el siguiente job pendiente de forma segura entre varios workers:
// FOR UPDATE SKIP LOCKED evita que dos procesos tomen el mismo job a la vez
async function tomarSiguienteJobPendiente() {
    const { rows } = await pool.query(`
        UPDATE jobs
        SET estado = 'processing', actualizado_en = now()
        WHERE id = (
            SELECT id FROM jobs
            WHERE estado = 'pending'
            ORDER BY creado_en
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        )
        RETURNING *;
    `);
    return rows[0];
}

async function marcarJobComoTerminado(id, rutaResultado) {
    await pool.query(
        `UPDATE jobs
         SET estado = 'done', ruta_resultado = $1, actualizado_en = now()
         WHERE id = $2`,
        [rutaResultado, id]
    );
}

async function marcarJobComoFallido(id, errorMensaje) {
    await pool.query(
        `UPDATE jobs
         SET estado = 'failed', error_mensaje = $1, intentos = intentos + 1, actualizado_en = now()
         WHERE id = $2`,
        [errorMensaje, id]
    );
}

// Jobs terminados hace más de X horas, candidatos a limpieza
async function obtenerJobsVencidos(horas) {
    const { rows } = await pool.query(
        `SELECT id, ruta_resultado FROM jobs
         WHERE estado IN ('done', 'failed')
         AND actualizado_en < now() - ($1 || ' hours')::interval`,
        [horas]
    );
    return rows;
}

async function eliminarJobsPorIds(ids) {
    if (ids.length === 0) return;
    await pool.query('DELETE FROM jobs WHERE id = ANY($1::int[])', [ids]);
}

module.exports = {
    crearJob,
    obtenerJobPorId,
    tomarSiguienteJobPendiente,
    marcarJobComoTerminado,
    marcarJobComoFallido,
    obtenerJobsVencidos,
    eliminarJobsPorIds
};
