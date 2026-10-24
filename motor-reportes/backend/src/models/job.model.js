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

// Historial: los últimos N jobs, del más nuevo al más viejo
async function listarJobs(limite = 50) {
    const { rows } = await pool.query(
        'SELECT * FROM jobs ORDER BY creado_en DESC, id DESC LIMIT $1',
        [limite]
    );
    return rows;
}

// Toma el siguiente job pendiente de forma segura entre varios workers:
// FOR UPDATE SKIP LOCKED evita que dos procesos tomen el mismo job a la vez
async function tomarSiguienteJobPendiente() {
    const { rows } = await pool.query(`
        UPDATE jobs
        SET estado = 'processing', progreso = 0, actualizado_en = now()
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

// El worker va guardando el avance (0-100) mientras genera el archivo
async function actualizarProgreso(id, progreso) {
    await pool.query(
        'UPDATE jobs SET progreso = $1, actualizado_en = now() WHERE id = $2',
        [progreso, id]
    );
}

async function marcarJobComoTerminado(id, rutaResultado) {
    await pool.query(
        `UPDATE jobs
         SET estado = 'done', ruta_resultado = $1, progreso = 100, actualizado_en = now()
         WHERE id = $2`,
        [rutaResultado, id]
    );
}

// Registra un fallo. Si todavía quedan intentos, el job vuelve a 'pending'
// (el worker lo reintentará); si ya se acabaron, queda en 'failed'.
async function registrarFallo(id, errorMensaje, maxIntentos) {
    const { rows } = await pool.query(
        `UPDATE jobs
         SET intentos = intentos + 1,
             error_mensaje = $1,
             progreso = 0,
             estado = CASE WHEN intentos + 1 >= $3 THEN 'failed' ELSE 'pending' END,
             actualizado_en = now()
         WHERE id = $2
         RETURNING estado, intentos`,
        [errorMensaje, id, maxIntentos]
    );
    return rows[0];
}

// Jobs terminados (o fallidos) hace más de X minutos, candidatos a limpieza
async function obtenerJobsVencidos(minutos) {
    const { rows } = await pool.query(
        `SELECT id, ruta_resultado FROM jobs
         WHERE estado IN ('done', 'failed')
         AND actualizado_en < now() - ($1::int * interval '1 minute')`,
        [minutos]
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
    listarJobs,
    tomarSiguienteJobPendiente,
    actualizarProgreso,
    marcarJobComoTerminado,
    registrarFallo,
    obtenerJobsVencidos,
    eliminarJobsPorIds
};
