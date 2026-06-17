import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { env } from "../config/env";
import * as schema from "../database/db";

export type TestDbContext = {
	pool: Pool;
	db: NodePgDatabase<typeof schema>;
	testDbName: string;
};

const testAdminDbUrl = env.ADMIN_DB_URL;

export async function createTestDb(): Promise<TestDbContext> {
	const testDbName = `test_db_${randomUUID().replace(/-/g, "")}`;
	const testDbUrl =
		`postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}` +
		`@postgres:5432/${testDbName}`;
	const adminPool = new Pool({ connectionString: testAdminDbUrl });
	await adminPool.query(`CREATE DATABASE ${testDbName}`);

	const pool = new Pool({
		connectionString: testDbUrl,
		max: 10,
		idleTimeoutMillis: 30000,
	});

	const db = drizzle(pool, { schema, casing: "snake_case" });
	await migrate(db, {
		migrationsFolder: join(__dirname, "../database/drizzle"),
	});

	return { pool, db, testDbName };
}

export async function deleteTestDb({ pool, testDbName }: TestDbContext) {
	await pool.end();
	const adminPool = new Pool({ connectionString: testAdminDbUrl });

	await adminPool.query(
		`SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
        `,
		[testDbName],
	);
	await adminPool.query(`DROP DATABASE IF EXISTS ${testDbName}`);
	await adminPool.end();
}
