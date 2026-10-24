# Motor de Reportes Asíncronos con Control de Recursos

Cola de renderizado PDF/Excel en workers desacoplados, con monitoreo de RAM/CPU,
enlaces temporales firmados para descarga, y recolección de basura automática.

## Estructura del proyecto

```
motor-reportes/
├── backend/   ← API + worker (estructurado: config/controllers/models/routes/services)
└── frontend/  ← Vue 3 + Vite (views, components, layouts, router, services, store), consume la API
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

## 3. Frontend (Vue 3 + Vite)

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. Asegúrate de que el backend (API + worker) ya esté corriendo.
Si tu API usa otro puerto, copia `.env.example` a `.env` y cambia `VITE_API_URL`.

Estructura de `frontend/src/`:
- `views/` pantallas (Generar reporte, Recursos)
- `components/` piezas reutilizables (formulario, estado, panel de recursos)
- `layouts/` estructura común (encabezado + contenido)
- `router/`, `services/` (axios), `store/` (Pinia)

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

## 5. Funciones adicionales

- **Monitoreo real de CPU/RAM** (también en Windows): el worker no toma trabajos nuevos
  si la CPU o la RAM superan `UMBRAL_CPU` / `UMBRAL_RAM`.
- **Barra de progreso:** el worker guarda el avance (0-100) del reporte en la base de datos.
- **Reintentos automáticos:** si un reporte falla, vuelve a la cola hasta `MAX_INTENTOS` veces
  antes de quedar como `failed`.
- **Historial:** `GET /api/reportes` y la vista "Historial" del frontend.
- **Limpieza manual:** `POST /api/mantenimiento/limpieza?minutos=N` y el botón en
  "Recursos y limpieza". La limpieza automática sigue corriendo cada hora.

### Cómo demostrarlo

| Qué mostrar | Cómo |
|---|---|
| Barra de progreso | En `backend/.env` pon `RETARDO_LOTE_MS=300`, reinicia el worker y genera un reporte de 5000 filas |
| Reintentos | Genera un reporte cuyo título contenga la palabra `fallar` y mira la terminal del worker |
| Control de recursos | Pon `UMBRAL_RAM=1` en `.env` y reinicia el worker: dejará de tomar trabajos |
| Enlace que expira | Pon `MINUTOS_LINK=1`, descarga un reporte y repite el enlace pasado 1 minuto |
| Recolección de basura | En "Recursos y limpieza" escribe `0` minutos y pulsa el botón |

Después de actualizar el código ejecuta una vez `npm run migrate` en `backend` (agrega la columna `progreso`).
