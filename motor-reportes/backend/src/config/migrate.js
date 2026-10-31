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
<<<<<<< HEAD
                    CHECK (estado IN ('pending', 'processing', 'done', 'failed', 'cancelled')),
=======
                    CHECK (estado IN ('pending', 'processing', 'done', 'failed')),
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
                ruta_resultado TEXT,
                error_mensaje TEXT,
                intentos INT NOT NULL DEFAULT 0,
                progreso INT NOT NULL DEFAULT 0,
<<<<<<< HEAD
                prioridad INT NOT NULL DEFAULT 1,
=======
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
                creado_en TIMESTAMP NOT NULL DEFAULT now(),
                actualizado_en TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        // Si la tabla ya existía de antes (sin la columna de progreso), la agrega.
        await pool.query(`
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS progreso INT NOT NULL DEFAULT 0;
        `);

<<<<<<< HEAD
        // Prioridad del reporte: 0 = baja, 1 = normal, 2 = alta
        await pool.query(`
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS prioridad INT NOT NULL DEFAULT 1;
        `);

        // Agrega el estado 'cancelled' a tablas creadas antes de esta versión
        await pool.query(`ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_estado_check;`);
        await pool.query(`
            ALTER TABLE jobs ADD CONSTRAINT jobs_estado_check
            CHECK (estado IN ('pending', 'processing', 'done', 'failed', 'cancelled'));
        `);

=======
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_jobs_estado ON jobs (estado);
        `);

        console.log('✅ Migración completada: tabla "jobs" lista.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en la migración:', err);
        process.exit(1);
    }
}

migrar();
