const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const autenticar = require('../middlewares/autenticar');
const limitarPeticiones = require('../middlewares/limitarPeticiones');

const limitarAuth = limitarPeticiones.crearLimitadorAuth();

/**
 * @openapi
 * /api/auth/registro:
 *   post:
 *     summary: Crea una cuenta y devuelve el token de sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre: { type: string, example: Ana Pérez }
 *               email: { type: string, example: ana@correo.com }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201: { description: Cuenta creada. Devuelve token y usuario }
 *       400: { description: Datos inválidos }
 *       409: { description: El correo ya existe }
 */
router.post('/registro', limitarAuth, controller.registrar);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión y devuelve el token (JWT)
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Sesión iniciada. Devuelve token y usuario }
 *       401: { description: Correo o clave incorrectos }
 */
router.post('/login', limitarAuth, controller.iniciarSesion);

/**
 * @openapi
 * /api/auth/yo:
 *   get:
 *     summary: Devuelve el usuario de la sesión actual
 *     tags: [Autenticación]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Usuario actual }
 *       401: { description: Sin sesión }
 */
router.get('/yo', autenticar, controller.quienSoy);

module.exports = router;
