// El límite se configura ANTES de cargar la app, porque se lee al iniciar el módulo.
process.env.RATE_LIMIT_MAX = '3';
process.env.RATE_LIMIT_VENTANA_SEG = '60';

jest.mock('../src/models/job.model');
jest.mock('../src/models/usuario.model');
jest.mock('../src/services/queue.service');

const request = require('supertest');
const queueService = require('../src/services/queue.service');
const usuarioModel = require('../src/models/usuario.model');
const { crearTokenSesion } = require('../src/services/auth.service');
const app = require('../src/app');

const USUARIO = { id: 1, nombre: 'Ana', email: 'ana@correo.com' };

test('la 4.ª petición seguida recibe 429 con Retry-After', async () => {
    queueService.encolarReporte.mockResolvedValue({ id: 1, estado: 'pending', progreso: 0 });
    usuarioModel.buscarPorId.mockResolvedValue(USUARIO);
    const auth = { Authorization: `Bearer ${crearTokenSesion(USUARIO)}` };
    const enviar = () => request(app).post('/api/reportes').set(auth).send({ tipo: 'pdf', titulo: 'x' });

    for (let i = 0; i < 3; i++) {
        const ok = await enviar();
        expect(ok.status).toBe(201);
    }
    const bloqueada = await enviar();
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.headers['retry-after']).toBeDefined();
});
