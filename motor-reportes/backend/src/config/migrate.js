// Script de migración: crea las tablas necesarias si no existen.
// Se corre una sola vez (o cada vez que cambie el esquema) con: npm run migrate
const pool = require('./db');

async function migrar() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                id SERIAL PRIMARY KEY,
                tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('pdf', 'excel')),
                titulo VARCHAR(255) NOT NULL,
                payload JSONB NOT NULL,
                estado VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (estado IN ('pending', 'processing', 'done', 'failed', 'cancelled')),
                ruta_resultado TEXT,
                error_mensaje TEXT,
                intentos INT NOT NULL DEFAULT 0,
                progreso INT NOT NULL DEFAULT 0,
                prioridad INT NOT NULL DEFAULT 1,
                creado_en TIMESTAMP NOT NULL DEFAULT now(),
                actualizado_en TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        // Usuarios del sistema (login con JWT). La clave se guarda con hash, nunca en texto plano.
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                creado_en TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        // Ventas: datos reales sobre los que se generan los reportes (se llena con: npm run seed)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ventas (
                id SERIAL PRIMARY KEY,
                fecha DATE NOT NULL,
                producto VARCHAR(100) NOT NULL,
                categoria VARCHAR(50) NOT NULL,
                cantidad INT NOT NULL,
                precio_unitario NUMERIC(12, 2) NOT NULL,
                total NUMERIC(14, 2) NOT NULL
            );
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas (fecha);`);

        // Dueño del reporte: cada usuario solo ve los suyos
        await pool.query(`
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL;
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_jobs_usuario ON jobs (usuario_id);`);

        // Si la tabla ya existía de antes (sin la columna de progreso), la agrega.
        await pool.query(`
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS progreso INT NOT NULL DEFAULT 0;
        `);

        // Prioridad del reporte: 0 = baja, 1 = normal, 2 = alta
        await pool.query(`
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS prioridad INT NOT NULL DEFAULT 1;
        `);

        // Qué worker procesó el reporte (sirve para demostrar varios workers en paralelo)
        await pool.query(`
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS worker_id VARCHAR(30);
        `);

        // Agrega el estado 'cancelled' a tablas creadas antes de esta versión
        await pool.query(`ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_estado_check;`);
        await pool.query(`
            ALTER TABLE jobs ADD CONSTRAINT jobs_estado_check
            CHECK (estado IN ('pending', 'processing', 'done', 'failed', 'cancelled'));
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_jobs_estado ON jobs (estado);
        `);

        console.log('✅ Migración completada: tablas listas (jobs, usuarios, ventas).');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en la migración:', err);
        process.exit(1);
    }
}

migrar();
