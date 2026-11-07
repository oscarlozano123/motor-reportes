// Llena la tabla "ventas" con datos de ejemplo para poder generar reportes reales.
// Uso:  npm run seed          (solo si la tabla está vacía)
//       npm run seed -- --forzar   (borra y vuelve a llenar)
const pool = require('./db');
const ventaModel = require('../models/venta.model');

const CATALOGO = [
    ['Portátil', 'Tecnología', 2400000],
    ['Teléfono', 'Tecnología', 1500000],
    ['Audífonos', 'Tecnología', 180000],
    ['Teclado', 'Tecnología', 120000],
    ['Camiseta', 'Ropa', 55000],
    ['Jean', 'Ropa', 130000],
    ['Chaqueta', 'Ropa', 240000],
    ['Zapatillas', 'Ropa', 280000],
    ['Cafetera', 'Hogar', 210000],
    ['Licuadora', 'Hogar', 160000],
    ['Lámpara', 'Hogar', 75000],
    ['Silla', 'Hogar', 320000],
    ['Balón', 'Deportes', 70000],
    ['Pesas', 'Deportes', 150000],
    ['Bicicleta', 'Deportes', 1300000]
];

const CANTIDAD_VENTAS = 5000;
const INICIO = Date.UTC(2026, 0, 1);
const DIAS = 304; // del 1 de enero al 31 de octubre de 2026

// Generador pseudoaleatorio con semilla fija: siempre produce los mismos datos
function crearAleatorio(semilla) {
    let x = semilla;
    return () => {
        x = (x * 1664525 + 1013904223) % 4294967296;
        return x / 4294967296;
    };
}

function generarVentas() {
    const azar = crearAleatorio(2026);
    const ventas = [];
    for (let i = 0; i < CANTIDAD_VENTAS; i++) {
        const [producto, categoria, precioBase] = CATALOGO[Math.floor(azar() * CATALOGO.length)];
        const dia = Math.floor(azar() * DIAS);
        const fecha = new Date(INICIO + dia * 86400000).toISOString().slice(0, 10);
        const cantidad = 1 + Math.floor(azar() * 5);
        const precio = Math.round(precioBase * (0.9 + azar() * 0.2));
        ventas.push({ fecha, producto, categoria, cantidad, precio_unitario: precio, total: precio * cantidad });
    }
    return ventas;
}

async function sembrar() {
    try {
        const forzar = process.argv.includes('--forzar');
        const existentes = await ventaModel.contarVentas();

        if (existentes > 0 && !forzar) {
            console.log(`ℹ️  La tabla "ventas" ya tiene ${existentes} filas. Usa --forzar para reemplazarlas.`);
            return process.exit(0);
        }
        if (forzar) await pool.query('TRUNCATE ventas RESTART IDENTITY');

        const ventas = generarVentas();
        // Inserta por tandas para no pasar el límite de parámetros de PostgreSQL
        for (let i = 0; i < ventas.length; i += 1000) {
            await ventaModel.insertarVentas(ventas.slice(i, i + 1000));
        }
        console.log(`✅ ${ventas.length} ventas de ejemplo insertadas (enero a octubre de 2026).`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al sembrar los datos:', err.message);
        process.exit(1);
    }
}

sembrar();
