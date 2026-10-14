# Motor de Reportes Asíncronos con Control de Recursos

Cola de renderizado PDF/Excel en workers desacoplados, con monitoreo de RAM/CPU,
enlaces temporales firmados para descarga, y recolección de basura automática.

## Estructura del proyecto

```
motor-reportes/
├── backend/   ← API + worker (estructurado: config/controllers/models/routes/services)
└── frontend/  ← HTML/CSS/JS plano, consume la API
```

## 1. Base de datos (PostgreSQL + DBeaver)

1. Instala PostgreSQL si no lo tienes.
2. Abre **DBeaver** → Nueva conexión → PostgreSQL (host `localhost`, tu usuario/clave).
3. Crea una base de datos llamada `reportes_db` (clic derecho en el servidor → Create New Database).

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` con los datos reales de tu PostgreSQL (usuario, clave, nombre de la base)
y cambia `JWT_SECRET` por una clave propia.

Crea la tabla `jobs`:
```bash
npm run migrate
```

Corre la API (una terminal de Git Bash):
```bash
npm run dev
```

Corre el worker (**otra terminal distinta** — así es como queda "desacoplado" del API):
```bash
npm run worker
```

La API queda en `http://localhost:4000`, y la documentación Swagger en
`http://localhost:4000/api/docs`.

## 3. Frontend

Abre la carpeta `frontend/` con **Live Server** en VS Code (clic derecho sobre
`index.html` → "Open with Live Server"). Asegúrate de que el backend (API + worker)
ya esté corriendo.

## 4. Flujo de uso

1. En el formulario, elige tipo (PDF/Excel), título y cantidad de filas.
2. Al enviar, el frontend hace `POST /api/reportes` → el job queda `pending`.
3. El **worker** (proceso aparte) lo toma, revisa que la CPU/RAM estén bajo el
   umbral configurado, y genera el archivo en `backend/storage/`.
4. El frontend hace polling a `GET /api/reportes/:id` cada 2s hasta ver `estado: done`.
5. Al terminar, la API entrega un **enlace firmado (JWT)** con expiración —
   ese es el único link válido para descargar el archivo.
6. Cada hora, el backend corre una **limpieza automática** que borra archivos y
   registros de reportes con más de `HORAS_RETENCION` horas (configurable en `.env`).

## 5. Subir todo a GitHub (Git Bash)

```bash
cd motor-reportes
git init
git remote add origin https://github.com/TU_USUARIO/motor-reportes.git
git add .
git commit -m "Motor de reportes asincronos: backend estructurado + frontend"
git branch -M main
git push -u origin main
```

> `.env` y `backend/storage/*` están en `.gitignore` a propósito — nunca se suben
> las credenciales reales ni los archivos generados.
