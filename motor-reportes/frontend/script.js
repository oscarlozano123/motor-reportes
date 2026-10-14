// Cambia esto si tu backend corre en otra URL/puerto
const API_URL = 'http://localhost:4000/api';

const formulario = document.getElementById('formulario-reporte');
const divEstado = document.getElementById('estado-reporte');
const divRecursos = document.getElementById('recursos-servidor');

let intervaloConsulta = null;

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const tipo = document.getElementById('tipo').value;
    const titulo = document.getElementById('titulo').value;
    const filas = Number(document.getElementById('filas').value);

    divEstado.innerHTML = 'Encolando reporte...';

    try {
        const respuesta = await fetch(`${API_URL}/reportes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo,
                titulo,
                filas,
                columnas: ['Columna A', 'Columna B', 'Columna C']
            })
        });

        if (!respuesta.ok) {
            const error = await respuesta.json();
            throw new Error(error.error || 'Error al encolar el reporte');
        }

        const job = await respuesta.json();
        divEstado.innerHTML = `Reporte #${job.id} encolado. Estado: <strong>${job.estado}</strong>`;

        // Empieza a consultar el estado cada 2 segundos hasta que termine
        if (intervaloConsulta) clearInterval(intervaloConsulta);
        intervaloConsulta = setInterval(() => consultarEstado(job.id), 2000);

    } catch (error) {
        divEstado.innerHTML = `<span class="error">Error: ${error.message}</span>`;
    }
});

async function consultarEstado(id) {
    try {
        const respuesta = await fetch(`${API_URL}/reportes/${id}`);
        const job = await respuesta.json();

        if (job.estado === 'pending' || job.estado === 'processing') {
            divEstado.innerHTML = `Reporte #${job.id} — Estado: <strong>${job.estado}</strong>...`;
            return;
        }

        clearInterval(intervaloConsulta);

        if (job.estado === 'done') {
            const urlCompleta = `${API_URL}${job.descarga.url.replace('/api', '')}`;
            divEstado.innerHTML = `
                Reporte #${job.id} listo ✔<br>
                <a href="${urlCompleta}" target="_blank">Descargar reporte</a>
                (enlace válido ${job.descarga.expiraEnMinutos} minutos)
            `;
        } else if (job.estado === 'failed') {
            divEstado.innerHTML = `<span class="error">Reporte #${job.id} falló: ${job.error}</span>`;
        }

    } catch (error) {
        console.error('Error consultando estado:', error);
    }
}

// Refresca el panel de CPU/RAM del servidor cada 4 segundos
async function consultarRecursos() {
    try {
        const respuesta = await fetch(`${API_URL}/recursos`);
        const datos = await respuesta.json();
        divRecursos.innerHTML = `
            CPU: <strong>${datos.cpuPct}%</strong> &nbsp;|&nbsp;
            RAM: <strong>${datos.ramPct}%</strong> &nbsp;|&nbsp;
            Núcleos: ${datos.nucleos}
        `;
    } catch (error) {
        divRecursos.innerHTML = '<span class="error">No se pudo conectar con el backend.</span>';
    }
}

consultarRecursos();
setInterval(consultarRecursos, 4000);
