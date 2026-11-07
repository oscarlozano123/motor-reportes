// Límite de peticiones por IP (rate limiting), sin librerías externas.
// Evita que un solo cliente llene la cola con miles de reportes (o pruebe claves sin parar).
// Guarda en memoria cuántas peticiones hizo cada IP en la ventana actual.
const todosLosContadores = []; // para poder limpiarlos en un solo lugar

function crearLimitador({ max, ventanaSeg }) {
    const ventanaMs = ventanaSeg * 1000;
    const contadores = new Map(); // ip -> { cuenta, reinicio }
    todosLosContadores.push(contadores);

    return function limitar(req, res, next) {
        const ahora = Date.now();
        const ip = req.ip;
        let registro = contadores.get(ip);

        if (!registro || ahora >= registro.reinicio) {
            registro = { cuenta: 0, reinicio: ahora + ventanaMs };
            contadores.set(ip, registro);
        }

        registro.cuenta += 1;
        res.set('X-RateLimit-Limit', String(max));
        res.set('X-RateLimit-Remaining', String(Math.max(max - registro.cuenta, 0)));

        if (registro.cuenta > max) {
            const segundos = Math.ceil((registro.reinicio - ahora) / 1000);
            res.set('Retry-After', String(segundos));
            return res.status(429).json({
                error: `Demasiadas solicitudes. Intenta de nuevo en ${segundos} segundo(s).`
            });
        }
        next();
    };
}

// Limitador por defecto: crear reportes
const limitarPeticiones = crearLimitador({
    max: Number(process.env.RATE_LIMIT_MAX || 20),
    ventanaSeg: Number(process.env.RATE_LIMIT_VENTANA_SEG || 60)
});

// Limitador para login/registro (frena el adivinar claves)
limitarPeticiones.crearLimitadorAuth = () => crearLimitador({
    max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
    ventanaSeg: Number(process.env.RATE_LIMIT_VENTANA_SEG || 60)
});

// Limpia registros vencidos para que los mapas no crezcan sin fin
setInterval(() => {
    const ahora = Date.now();
    for (const mapa of todosLosContadores) {
        for (const [ip, registro] of mapa) {
            if (ahora >= registro.reinicio) mapa.delete(ip);
        }
    }
}, 60 * 1000).unref();

// Solo para pruebas
limitarPeticiones._reiniciar = () => todosLosContadores.forEach((m) => m.clear());

module.exports = limitarPeticiones;
