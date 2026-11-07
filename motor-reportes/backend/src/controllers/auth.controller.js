const usuarioModel = require('../models/usuario.model');
const { hashearPassword, compararPassword, crearTokenSesion } = require('../services/auth.service');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function respuestaSesion(usuario) {
    return {
        token: crearTokenSesion(usuario),
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
    };
}

// POST /api/auth/registro
async function registrar(req, res) {
    try {
        const nombre = String(req.body.nombre || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!nombre) return res.status(400).json({ error: "El campo 'nombre' es obligatorio" });
        if (!REGEX_EMAIL.test(email)) return res.status(400).json({ error: 'El correo no es válido' });
        if (password.length < 6) {
            return res.status(400).json({ error: 'La clave debe tener al menos 6 caracteres' });
        }

        if (await usuarioModel.buscarPorEmail(email)) {
            return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
        }

        const usuario = await usuarioModel.crearUsuario(nombre, email, await hashearPassword(password));
        res.status(201).json(respuestaSesion(usuario));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
}

// POST /api/auth/login
async function iniciarSesion(req, res) {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        const usuario = await usuarioModel.buscarPorEmail(email);
        // Mismo mensaje si falla el correo o la clave: no revelamos cuál de los dos fue
        if (!usuario || !(await compararPassword(password, usuario.password_hash))) {
            return res.status(401).json({ error: 'Correo o clave incorrectos' });
        }

        res.json(respuestaSesion(usuario));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
}

// GET /api/auth/yo — el usuario de la sesión actual
function quienSoy(req, res) {
    res.json({ id: req.usuario.id, nombre: req.usuario.nombre, email: req.usuario.email });
}

module.exports = { registrar, iniciarSesion, quienSoy };
