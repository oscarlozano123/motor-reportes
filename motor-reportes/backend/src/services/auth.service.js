const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const HORAS_SESION = Number(process.env.HORAS_SESION || 8);

// La clave nunca se guarda: solo su "hash" (bcrypt), que no se puede revertir
function hashearPassword(password) {
    return bcrypt.hash(password, 10);
}

function compararPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Token de SESIÓN. Lleva tipo: 'sesion' para que no se confunda con los
// enlaces firmados de descarga (que usan la misma clave pero otro contenido).
function crearTokenSesion(usuario) {
    return jwt.sign(
        { usuarioId: usuario.id, tipo: 'sesion' },
        process.env.JWT_SECRET,
        { expiresIn: `${HORAS_SESION}h` }
    );
}

// Devuelve el id del usuario, o null si el token es inválido, expiró o no es de sesión
function verificarTokenSesion(token) {
    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);
        return datos.tipo === 'sesion' ? datos.usuarioId : null;
    } catch (error) {
        return null;
    }
}

module.exports = { hashearPassword, compararPassword, crearTokenSesion, verificarTokenSesion };
