// Variables de entorno para las pruebas (no tocan tu .env real)
process.env.JWT_SECRET = 'clave_de_pruebas';
process.env.MINUTOS_LINK = '10';

// Valores fijos para que las pruebas no dependan de lo que tengas en tu .env
process.env.RATE_LIMIT_MAX = '20';
process.env.RATE_LIMIT_AUTH_MAX = '10';
process.env.RATE_LIMIT_VENTANA_SEG = '60';
