import postgres from "postgres";
import { env } from "$env/dynamic/private";
import { dev } from "$app/environment";

if (!env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is missing");
}

// 1. Use ReturnType<typeof postgres> to magically infer the correct type without using 'any'
const globalForPostgres = globalThis as unknown as {
	__postgres: ReturnType<typeof postgres> | undefined;
};

// Standard connection pool
const sql =
	globalForPostgres.__postgres ??
	postgres(env.DATABASE_URL, {
		max: 10,
		idle_timeout: 20,
		max_lifetime: 60 * 30,
		connect_timeout: 10,
	});

// Cache the connection in development mode to prevent Hot Module Replacement crashes
if (dev) {
	globalForPostgres.__postgres = sql;
}

export default sql;
