const pool = require('../config/db');

// Crea un nuevo job en estado 'pending' y devuelve su fila completa
async function crearJob(tipo, titulo, payload, prioridad = 1, usuarioId = null) {
    const { rows } = await pool.query(
        `INSERT INTO jobs (tipo, titulo, payload, prioridad, usuario_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [tipo, titulo, payload, prioridad, usuarioId]
    );
    return rows[0];
}

// Consulta mínima para saber si la base de datos responde
async function comprobarConexion() {
    await pool.query('SELECT 1');
}

// Busca un job por su id
async function obtenerJobPorId(id) {
    const { rows } = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    return rows[0];
}

// Busca un job SOLO si pertenece a ese usuario (así nadie ve reportes ajenos)
async function obtenerJobDeUsuario(id, usuarioId) {
    const { rows } = await pool.query(
        'SELECT * FROM jobs WHERE id = $1 AND usuario_id = $2',
        [id, usuarioId]
    );
    return rows[0];
}

// Historial de un usuario: sus últimos N jobs, del más nuevo al más viejo
async function listarJobs(limite = 50, usuarioId) {
    const { rows } = await pool.query(
        'SELECT * FROM jobs WHERE usuario_id = $2 ORDER BY creado_en DESC, id DESC LIMIT $1',
        [limite, usuarioId]
    );
    return rows;
}

// Toma el siguiente job pendiente (primero los de mayor prioridad, luego los más antiguos)
// de forma segura entre varios workers:
// FOR UPDATE SKIP LOCKED evita que dos procesos tomen el mismo job a la vez
async function tomarSiguienteJobPendiente(workerId = null) {
    const { rows } = await pool.query(`
        UPDATE jobs
        SET estado = 'processing', progreso = 0, worker_id = $1, actualizado_en = now()
        WHERE id = (
            SELECT id FROM jobs
            WHERE estado = 'pending'
            ORDER BY prioridad DESC, creado_en
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        )
        RETURNING *;
    `, [workerId]);
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

// Cancela un job SOLO si todavía está pendiente. Devuelve la fila, o undefined si ya
// no estaba pendiente (por ejemplo, el worker alcanzó a tomarlo).
async function cancelarJob(id, usuarioId) {
    const { rows } = await pool.query(
        `UPDATE jobs
         SET estado = 'cancelled', actualizado_en = now()
         WHERE id = $1 AND usuario_id = $2 AND estado = 'pending'
         RETURNING *`,
        [id, usuarioId]
    );
    return rows[0];
}

// Jobs terminados (o fallidos) hace más de X minutos, candidatos a limpieza
async function obtenerJobsVencidos(minutos) {
    const { rows } = await pool.query(
        `SELECT id, ruta_resultado FROM jobs
         WHERE estado IN ('done', 'failed', 'cancelled')
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
    comprobarConexion,
    crearJob,
    obtenerJobPorId,
    obtenerJobDeUsuario,
    listarJobs,
    tomarSiguienteJobPendiente,
    actualizarProgreso,
    marcarJobComoTerminado,
    registrarFallo,
    cancelarJob,
    obtenerJobsVencidos,
    eliminarJobsPorIds
};
