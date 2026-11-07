// Guarda el token de sesión en el navegador (localStorage).
// Todo va en try/catch: en modo privado o con datos bloqueados puede fallar,
// y en ese caso la sesión simplemente vive en memoria hasta cerrar la pestaña.
const CLAVE = 'motor-reportes-token'
let enMemoria = null

export function leerToken() {
  try {
    return localStorage.getItem(CLAVE) || enMemoria
  } catch {
    return enMemoria
  }
}

export function guardarToken(token) {
  enMemoria = token
  try {
    localStorage.setItem(CLAVE, token)
  } catch {
    /* se queda en memoria */
  }
}

export function borrarToken() {
  enMemoria = null
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* nada que borrar */
  }
}
