const jwt = require('jsonwebtoken');
require('dotenv').config();

const MINUTOS_LINK = Number(process.env.MINUTOS_LINK || 10);

// Genera una ruta de descarga con un token firmado que expira a los X minutos
function generarLinkFirmado(jobId) {
    const token = jwt.sign({ jobId }, process.env.JWT_SECRET, {
        expiresIn: `${MINUTOS_LINK}m`
    });
    return {
        url: `/api/reportes/${jobId}/descargar?token=${token}`,
        expiraEnMinutos: MINUTOS_LINK
    };
}

// Verifica que el token sea válido, no haya expirado, y corresponda a ese jobId
function verificarToken(token, jobId) {
    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);
        return datos.jobId === Number(jobId);
    } catch (error) {
        return false; // expirado, manipulado, o inválido
    }
}

module.exports = { generarLinkFirmado, verificarToken };
