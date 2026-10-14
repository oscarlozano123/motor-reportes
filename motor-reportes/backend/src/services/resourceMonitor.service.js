const os = require('os');
require('dotenv').config();

const UMBRAL_CPU = Number(process.env.UMBRAL_CPU || 85);
const UMBRAL_RAM = Number(process.env.UMBRAL_RAM || 85);

// Devuelve el estado actual de CPU/RAM del servidor (porcentajes aproximados)
function obtenerUsoRecursos() {
    const nucleos = os.cpus().length;
    const cargaPromedio1min = os.loadavg()[0];
    const cpuPct = Math.min(100, (cargaPromedio1min / nucleos) * 100);

    const memoriaTotal = os.totalmem();
    const memoriaLibre = os.freemem();
    const ramPct = ((memoriaTotal - memoriaLibre) / memoriaTotal) * 100;

    return {
        cpuPct: Number(cpuPct.toFixed(1)),
        ramPct: Number(ramPct.toFixed(1)),
        nucleos,
        memoriaTotalMB: Math.round(memoriaTotal / 1024 / 1024),
        memoriaLibreMB: Math.round(memoriaLibre / 1024 / 1024)
    };
}

// El worker consulta esto antes de tomar un nuevo job pesado
function hayRecursosDisponibles() {
    const { cpuPct, ramPct } = obtenerUsoRecursos();
    return cpuPct < UMBRAL_CPU && ramPct < UMBRAL_RAM;
}

module.exports = { obtenerUsoRecursos, hayRecursosDisponibles };
