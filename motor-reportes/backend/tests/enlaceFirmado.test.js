const jwt = require('jsonwebtoken');
const { generarLinkFirmado, verificarToken } = require('../src/services/signedLink.service');

function tokenDe(link) {
    return new URL(link.url, 'http://x').searchParams.get('token');
}

test('un enlace recién creado es válido para su job', () => {
    const token = tokenDe(generarLinkFirmado(5));
    expect(verificarToken(token, 5)).toBe(true);
});

test('el token de un job no sirve para otro', () => {
    const token = tokenDe(generarLinkFirmado(5));
    expect(verificarToken(token, 6)).toBe(false);
});

test('un token expirado se rechaza', () => {
    const vencido = jwt.sign({ jobId: 5 }, process.env.JWT_SECRET, { expiresIn: -10 });
    expect(verificarToken(vencido, 5)).toBe(false);
});

test('un token firmado con otra clave se rechaza', () => {
    const falso = jwt.sign({ jobId: 5 }, 'otra_clave');
    expect(verificarToken(falso, 5)).toBe(false);
});

const { crearTokenSesion, verificarTokenSesion } = require('../src/services/auth.service');

test('un token de sesión NO sirve como enlace de descarga', () => {
    const sesion = crearTokenSesion({ id: 5 });
    expect(verificarToken(sesion, 5)).toBe(false);
});

test('un enlace de descarga NO sirve como token de sesión', () => {
    const enlace = tokenDe(generarLinkFirmado(5));
    expect(verificarTokenSesion(enlace)).toBeNull();
});

test('un token de sesión válido devuelve el id del usuario', () => {
    expect(verificarTokenSesion(crearTokenSesion({ id: 7 }))).toBe(7);
});
