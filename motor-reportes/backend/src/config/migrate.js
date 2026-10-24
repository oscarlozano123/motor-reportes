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
                    CHECK (estado IN ('pending', 'processing', 'done', 'failed')),
                ruta_resultado TEXT,
                error_mensaje TEXT,
                intentos INT NOT NULL DEFAULT 0,
                progreso INT NOT NULL DEFAULT 0,
                creado_en TIMESTAMP NOT NULL DEFAULT now(),
                actualizado_en TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        // Si la tabla ya existía de antes (sin la columna de progreso), la agrega.
        await pool.query(`
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS progreso INT NOT NULL DEFAULT 0;
        `);

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
