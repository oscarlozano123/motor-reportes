// La aplicación Express vive aquí (sin hacer listen) para poder probarla con Supertest.
// El arranque real del servidor está en index.js.
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const swaggerSpecs = require('./config/swagger');
const reportRoutes = require('./routes/report.routes');
const mantenimientoRoutes = require('./routes/mantenimiento.routes');
const authRoutes = require('./routes/auth.routes');
const ventasRoutes = require('./routes/ventas.routes');
const reportController = require('./controllers/report.controller');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reportes', reportRoutes);
app.use('/api/mantenimiento', mantenimientoRoutes);
app.get('/api/recursos', reportController.consultarRecursos);
app.get('/api/recursos/historial', reportController.consultarHistorialRecursos);
app.get('/api/salud', reportController.consultarSalud);

app.get('/', (req, res) => {
    res.json({ mensaje: 'Motor de Reportes Asíncronos — API activa' });
});

module.exports = app;
