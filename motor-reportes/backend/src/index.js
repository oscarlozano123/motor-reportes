const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const swaggerSpecs = require('./config/swagger');
const reportRoutes = require('./routes/report.routes');
const mantenimientoRoutes = require('./routes/mantenimiento.routes');
const reportController = require('./controllers/report.controller');
const { iniciarRecoleccionDeBasura } = require('./services/cleanup.service');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/api/reportes', reportRoutes);
app.use('/api/mantenimiento', mantenimientoRoutes);
app.get('/api/recursos', reportController.consultarRecursos);

app.get('/', (req, res) => {
    res.json({ mensaje: 'Motor de Reportes Asíncronos — API activa' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 API escuchando en http://localhost:${PORT}`);
    console.log(`📄 Documentación en http://localhost:${PORT}/api/docs`);

    // La limpieza (GC) es tarea liviana de mantenimiento, por eso corre dentro
    // del proceso del API; la generación pesada de reportes vive aparte, en el worker.
    iniciarRecoleccionDeBasura();
});
