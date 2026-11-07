require('dotenv').config();
const app = require('./app');
const { iniciarRecoleccionDeBasura } = require('./services/cleanup.service');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 API escuchando en http://localhost:${PORT}`);
    console.log(`📄 Documentación en http://localhost:${PORT}/api/docs`);

    // La limpieza (GC) es tarea liviana de mantenimiento, por eso corre dentro
    // del proceso del API; la generación pesada de reportes vive aparte, en el worker.
    iniciarRecoleccionDeBasura();
});
