jest.mock('../src/models/usuario.model');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const usuarioModel = require('../src/models/usuario.model');
const limitar = require('../src/middlewares/limitarPeticiones');
const app = require('../src/app');

beforeEach(() => {
    jest.resetAllMocks();
    limitar._reiniciar();
});

describe('POST /api/auth/registro', () => {
    test('rechaza un correo inválido', async () => {
        const res = await request(app).post('/api/auth/registro')
            .send({ nombre: 'Ana', email: 'no-es-correo', password: '123456' });
        expect(res.status).toBe(400);
    });

    test('rechaza una clave corta', async () => {
        const res = await request(app).post('/api/auth/registro')
            .send({ nombre: 'Ana', email: 'ana@correo.com', password: '123' });
        expect(res.status).toBe(400);
    });

    test('409 si el correo ya existe', async () => {
        usuarioModel.buscarPorEmail.mockResolvedValue({ id: 1 });
        const res = await request(app).post('/api/auth/registro')
            .send({ nombre: 'Ana', email: 'ana@correo.com', password: '123456' });
        expect(res.status).toBe(409);
    });

    test('crea la cuenta, guarda la clave con hash y devuelve token', async () => {
        usuarioModel.buscarPorEmail.mockResolvedValue(undefined);
        usuarioModel.crearUsuario.mockImplementation(async (nombre, email) => ({ id: 3, nombre, email }));

        const res = await request(app).post('/api/auth/registro')
            .send({ nombre: 'Ana', email: 'ANA@Correo.com', password: 'secreta1' });

        expect(res.status).toBe(201);
        expect(res.body.token).toBeDefined();
        expect(res.body.usuario.email).toBe('ana@correo.com');
        const hashGuardado = usuarioModel.crearUsuario.mock.calls[0][2];
        expect(hashGuardado).not.toBe('secreta1');
        expect(await bcrypt.compare('secreta1', hashGuardado)).toBe(true);
    });
});

describe('POST /api/auth/login', () => {
    test('200 con la clave correcta', async () => {
        const hash = await bcrypt.hash('secreta1', 4);
        usuarioModel.buscarPorEmail.mockResolvedValue({ id: 3, nombre: 'Ana', email: 'ana@correo.com', password_hash: hash });
        const res = await request(app).post('/api/auth/login')
            .send({ email: 'ana@correo.com', password: 'secreta1' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.usuario).not.toHaveProperty('password_hash');
    });

    test('401 con clave incorrecta', async () => {
        const hash = await bcrypt.hash('secreta1', 4);
        usuarioModel.buscarPorEmail.mockResolvedValue({ id: 3, email: 'ana@correo.com', password_hash: hash });
        const res = await request(app).post('/api/auth/login')
            .send({ email: 'ana@correo.com', password: 'otra' });
        expect(res.status).toBe(401);
    });

    test('401 si el correo no existe (mismo mensaje)', async () => {
        usuarioModel.buscarPorEmail.mockResolvedValue(undefined);
        const res = await request(app).post('/api/auth/login')
            .send({ email: 'nadie@correo.com', password: 'secreta1' });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Correo o clave incorrectos');
    });

    test('frena los intentos repetidos con 429', async () => {
        usuarioModel.buscarPorEmail.mockResolvedValue(undefined);
        let ultimo;
        for (let i = 0; i < 12; i++) {
            ultimo = await request(app).post('/api/auth/login').send({ email: 'x@x.com', password: 'y' });
        }
        expect(ultimo.status).toBe(429);
    });
});
