const swaggerJsdoc = require('swagger-jsdoc');

const opciones = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Motor de Reportes Asíncronos API',
            version: '2.0.0',
            description: 'API para encolar, monitorear y descargar reportes PDF/Excel generados de forma asíncrona. Para probar los endpoints protegidos: haz POST /api/auth/login, copia el token y pulsa "Authorize".'
        },
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            }
        }
    },
    // Lee los comentarios JSDoc dentro de las rutas para armar la documentación
    apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(opciones);

module.exports = specs;
