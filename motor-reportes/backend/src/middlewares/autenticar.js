const { verificarTokenSesion } = require('../services/auth.service');
const usuarioModel = require('../models/usuario.model');

// Exige la cabecera  Authorization: Bearer <token>  y deja el usuario en req.usuario
async function autenticar(req, res, next) {
    try {
        const cabecera = req.headers.authorization || '';
        const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
        const usuarioId = token ? verificarTokenSesion(token) : null;

        if (!usuarioId) {
            return res.status(401).json({ error: 'Debes iniciar sesión' });
        }

        const usuario = await usuarioModel.buscarPorId(usuarioId);
        if (!usuario) {
            return res.status(401).json({ error: 'Debes iniciar sesión' });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al validar la sesión' });
    }
}

module.exports = autenticar;
