const os = require('os');
require('dotenv').config();

const UMBRAL_CPU = Number(process.env.UMBRAL_CPU || 85);
const UMBRAL_RAM = Number(process.env.UMBRAL_RAM || 85);

// ---- CPU real (funciona en Windows, Linux y Mac) ----
// os.loadavg() siempre devuelve 0 en Windows, así que medimos la CPU comparando
// cuánto tiempo estuvieron ocupados los núcleos entre dos lecturas consecutivas.
function tomarMuestraCpu() {
    let inactivo = 0;
    let total = 0;
    for (const nucleo of os.cpus()) {
        for (const tipo in nucleo.times) {
            total += nucleo.times[tipo];
        }
        inactivo += nucleo.times.idle;
    }
    return { inactivo, total };
}

let muestraAnterior = tomarMuestraCpu();
let cpuPct = 0;

function actualizarCpu() {
    const actual = tomarMuestraCpu();
    const deltaTotal = actual.total - muestraAnterior.total;
    const deltaInactivo = actual.inactivo - muestraAnterior.inactivo;
    if (deltaTotal > 0) {
        cpuPct = (1 - deltaInactivo / deltaTotal) * 100;
    }
    muestraAnterior = actual;
}

// Se mide cada segundo en segundo plano; unref() evita que este temporizador
// mantenga vivo el proceso por sí solo.
setInterval(actualizarCpu, 1000).unref();

// Devuelve el estado actual de CPU/RAM del servidor (porcentajes aproximados)
function obtenerUsoRecursos() {
    const nucleos = os.cpus().length;

    const memoriaTotal = os.totalmem();
    const memoriaLibre = os.freemem();
    const ramPct = ((memoriaTotal - memoriaLibre) / memoriaTotal) * 100;

    return {
        cpuPct: Number(Math.max(0, Math.min(100, cpuPct)).toFixed(1)),
        ramPct: Number(ramPct.toFixed(1)),
        nucleos,
        memoriaTotalMB: Math.round(memoriaTotal / 1024 / 1024),
        memoriaLibreMB: Math.round(memoriaLibre / 1024 / 1024),
        umbralCpu: UMBRAL_CPU,
        umbralRam: UMBRAL_RAM
    };
}

// El worker consulta esto antes de tomar un nuevo job pesado
function hayRecursosDisponibles() {
    const { cpuPct, ramPct } = obtenerUsoRecursos();
    return cpuPct < UMBRAL_CPU && ramPct < UMBRAL_RAM;
}

module.exports = { obtenerUsoRecursos, hayRecursosDisponibles };
