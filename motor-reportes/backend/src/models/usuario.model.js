const pool = require('../config/db');

async function crearUsuario(nombre, email, passwordHash) {
    const { rows } = await pool.query(
        `INSERT INTO usuarios (nombre, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, nombre, email, creado_en`,
        [nombre, email, passwordHash]
    );
    return rows[0];
}

async function buscarPorEmail(email) {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return rows[0];
}

async function buscarPorId(id) {
    const { rows } = await pool.query(
        'SELECT id, nombre, email, creado_en FROM usuarios WHERE id = $1',
        [id]
    );
    return rows[0];
}

module.exports = { crearUsuario, buscarPorEmail, buscarPorId };
