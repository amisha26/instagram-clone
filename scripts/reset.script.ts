import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { join } from "node:path";
import { Pool } from 'pg'
import { env } from "../src/config/env"; 
import * as schema from '../src/database/models/auth.models';

const ADMIN_DB_URL = env.ADMIN_DB_URL
const INSTAGRAM_CLONE_URL = env.DATABASE_URL
const DB_NAME = INSTAGRAM_CLONE_URL?.split('/').pop()

async function dropAndCreateDb() {
    const adminPool = new Pool({ connectionString: ADMIN_DB_URL });

    await adminPool.query(
        `SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
        `,
        [DB_NAME]
    );
    await adminPool.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    await adminPool.query(`CREATE DATABASE ${DB_NAME}`)
    await adminPool.end();
}

async function runMigrations() {
    const pool = new Pool({
        connectionString: INSTAGRAM_CLONE_URL
      });
      
    const db = drizzle(pool, { schema, casing: 'snake_case' });
    await migrate(db, { migrationsFolder: join(__dirname, '../src/database/drizzle')});
    await pool.end()
} 


async function main() {
    console.log('Dropping and recreating database')
    await dropAndCreateDb();
    console.log("Running migrations")
    await runMigrations();
    console.log('Database reset complete')
}

main().catch((err) => console.log(err))