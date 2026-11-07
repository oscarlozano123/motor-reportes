// Pruebas del API sin base de datos: se simulan (mock) el modelo y la cola.
jest.mock('../src/models/job.model');
jest.mock('../src/models/usuario.model');
jest.mock('../src/services/queue.service');

const request = require('supertest');
const jobModel = require('../src/models/job.model');
const queueService = require('../src/services/queue.service');
const usuarioModel = require('../src/models/usuario.model');
const { crearTokenSesion } = require('../src/services/auth.service');
const limitar = require('../src/middlewares/limitarPeticiones');
const app = require('../src/app');

const USUARIO = { id: 1, nombre: 'Ana', email: 'ana@correo.com' };
const AUTH = { Authorization: `Bearer ${crearTokenSesion(USUARIO)}` };

beforeEach(() => {
    jest.resetAllMocks();
    limitar._reiniciar();
    usuarioModel.buscarPorId.mockResolvedValue(USUARIO);
});

describe('Rutas protegidas', () => {
    test('sin token responde 401', async () => {
        expect((await request(app).get('/api/reportes')).status).toBe(401);
        expect((await request(app).post('/api/reportes').send({})).status).toBe(401);
        expect((await request(app).post('/api/reportes/1/cancelar')).status).toBe(401);
        expect((await request(app).post('/api/mantenimiento/limpieza')).status).toBe(401);
    });

    test('un token inválido responde 401', async () => {
        const res = await request(app).get('/api/reportes').set('Authorization', 'Bearer basura');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/reportes', () => {
    test('rechaza un tipo inválido', async () => {
        const res = await request(app).post('/api/reportes').set(AUTH).send({ tipo: 'word', titulo: 'x' });
        expect(res.status).toBe(400);
    });

    test('rechaza si falta el título', async () => {
        const res = await request(app).post('/api/reportes').set(AUTH).send({ tipo: 'pdf' });
        expect(res.status).toBe(400);
    });

    test('rechaza una prioridad inválida', async () => {
        const res = await request(app)
            .post('/api/reportes')
            .set(AUTH)
            .send({ tipo: 'pdf', titulo: 'x', prioridad: 'urgente' });
        expect(res.status).toBe(400);
    });

    test('encola con prioridad "alta" = 2', async () => {
        queueService.encolarReporte.mockResolvedValue({ id: 7, estado: 'pending', progreso: 0 });
        const res = await request(app)
            .post('/api/reportes')
            .set(AUTH)
            .send({ tipo: 'excel', titulo: 'Ventas', filas: 100, prioridad: 'alta' });

        expect(res.status).toBe(201);
        expect(res.body.id).toBe(7);
        expect(res.body.prioridad).toBe('alta');
        expect(queueService.encolarReporte).toHaveBeenCalledWith(
            'excel', 'Ventas', expect.objectContaining({ filas: 100 }), 2, 1
        );
    });

    test('por defecto la prioridad es "normal" = 1', async () => {
        queueService.encolarReporte.mockResolvedValue({ id: 8, estado: 'pending', progreso: 0 });
        await request(app).post('/api/reportes').set(AUTH).send({ tipo: 'pdf', titulo: 'Algo' });
        expect(queueService.encolarReporte).toHaveBeenCalledWith('pdf', 'Algo', expect.any(Object), 1, 1);
    });
});

describe('POST /api/reportes/:id/cancelar', () => {
    test('200 si estaba pendiente', async () => {
        jobModel.cancelarJob.mockResolvedValue({
            id: 1, tipo: 'pdf', titulo: 'a', estado: 'cancelled', progreso: 0, intentos: 0, prioridad: 1
        });
        const res = await request(app).post('/api/reportes/1/cancelar').set(AUTH);
        expect(res.status).toBe(200);
        expect(res.body.estado).toBe('cancelled');
    });

    test('404 si no existe', async () => {
        jobModel.cancelarJob.mockResolvedValue(undefined);
        jobModel.obtenerJobDeUsuario.mockResolvedValue(undefined);
        const res = await request(app).post('/api/reportes/99/cancelar').set(AUTH);
        expect(res.status).toBe(404);
    });

    test('409 si ya estaba en proceso', async () => {
        jobModel.cancelarJob.mockResolvedValue(undefined);
        jobModel.obtenerJobDeUsuario.mockResolvedValue({ id: 2, estado: 'processing' });
        const res = await request(app).post('/api/reportes/2/cancelar').set(AUTH);
        expect(res.status).toBe(409);
    });
});

describe('GET /api/reportes/:id', () => {
    test('404 si no existe (o es de otro usuario)', async () => {
        jobModel.obtenerJobDeUsuario.mockResolvedValue(undefined);
        const res = await request(app).get('/api/reportes/5').set(AUTH);
        expect(res.status).toBe(404);
    });

    test('un reporte terminado trae enlace firmado de descarga', async () => {
        jobModel.obtenerJobDeUsuario.mockResolvedValue({
            id: 3, tipo: 'pdf', titulo: 't', estado: 'done', progreso: 100, intentos: 0,
            prioridad: 1, worker_id: '2'
        });
        const res = await request(app).get('/api/reportes/3').set(AUTH);
        expect(res.status).toBe(200);
        expect(res.body.descarga.url).toMatch(/^\/api\/reportes\/3\/descargar\?token=/);
        expect(res.body.worker).toBe('2');
    });
});

describe('Reportes de ventas reales', () => {
    const enviar = (cuerpo) => request(app).post('/api/reportes').set(AUTH).send(cuerpo);

    test('encola con filtros válidos', async () => {
        queueService.encolarReporte.mockResolvedValue({ id: 9, estado: 'pending', progreso: 0 });
        const res = await enviar({
            tipo: 'pdf', titulo: 'Marzo', fuente: 'ventas',
            filtros: { desde: '2026-03-01', hasta: '2026-03-31', categoria: 'Ropa' }
        });
        expect(res.status).toBe(201);
        expect(queueService.encolarReporte).toHaveBeenCalledWith(
            'pdf', 'Marzo',
            { titulo: 'Marzo', fuente: 'ventas', filtros: { desde: '2026-03-01', hasta: '2026-03-31', categoria: 'Ropa' } },
            1, 1
        );
    });

    test('rechaza una fecha con mal formato', async () => {
        const res = await enviar({ tipo: 'pdf', titulo: 'x', fuente: 'ventas', filtros: { desde: '01/03/2026' } });
        expect(res.status).toBe(400);
    });

    test('rechaza una fecha imposible (31 de febrero)', async () => {
        const res = await enviar({ tipo: 'pdf', titulo: 'x', fuente: 'ventas', filtros: { hasta: '2026-02-31' } });
        expect(res.status).toBe(400);
    });

    test("rechaza 'desde' posterior a 'hasta'", async () => {
        const res = await enviar({
            tipo: 'pdf', titulo: 'x', fuente: 'ventas',
            filtros: { desde: '2026-05-01', hasta: '2026-04-01' }
        });
        expect(res.status).toBe(400);
    });

    test('rechaza una fuente desconocida', async () => {
        const res = await enviar({ tipo: 'pdf', titulo: 'x', fuente: 'otra' });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/reportes (historial)', () => {
    test('lista solo los reportes del usuario de la sesión', async () => {
        jobModel.listarJobs.mockResolvedValue([]);
        const res = await request(app).get('/api/reportes').set(AUTH);
        expect(res.status).toBe(200);
        expect(jobModel.listarJobs).toHaveBeenCalledWith(50, 1);
    });
});

describe('GET /api/reportes/:id/descargar', () => {
    test('403 sin token', async () => {
        const res = await request(app).get('/api/reportes/3/descargar');
        expect(res.status).toBe(403);
    });

    test('403 con token manipulado', async () => {
        const res = await request(app).get('/api/reportes/3/descargar?token=falso');
        expect(res.status).toBe(403);
    });
});

describe('GET /api/salud', () => {
    test('ok cuando la base responde', async () => {
        jobModel.comprobarConexion.mockResolvedValue();
        const res = await request(app).get('/api/salud');
        expect(res.status).toBe(200);
        expect(res.body.baseDeDatos).toBe('ok');
    });

    test('503 cuando la base no responde', async () => {
        jobModel.comprobarConexion.mockRejectedValue(new Error('caída'));
        const res = await request(app).get('/api/salud');
        expect(res.status).toBe(503);
    });
});

describe('GET /api/recursos', () => {
    test('devuelve CPU y RAM', async () => {
        const res = await request(app).get('/api/recursos');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('cpuPct');
        expect(res.body).toHaveProperty('ramPct');
    });
});
