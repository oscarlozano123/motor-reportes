const { verificarToken } = require('../services/signedLink.service');

// Protege la descarga: exige un token firmado válido y no vencido para ese jobId
function validarLinkFirmado(req, res, next) {
    const { id } = req.params;
    const { token } = req.query;

    if (!token || !verificarToken(token, id)) {
        return res.status(403).json({ error: 'Enlace inválido o expirado' });
    }

    next();
}

module.exports = validarLinkFirmado;
