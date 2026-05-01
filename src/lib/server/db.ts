import postgres from "postgres";
import { env } from "$env/dynamic/private";
import { dev } from "$app/environment";

if (!env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is missing");
}

declare global {
	var __postgres: ReturnType<typeof postgres> | undefined;
}

const sql =
	globalThis.__postgres ??
	postgres(env.DATABASE_URL, {
		max: dev ? 10 : 1,

		// IMPORTANT: must be false in production for Supavisor
		prepare: dev,

		idle_timeout: 20,
		connect_timeout: 10,
	});

if (dev) {
	globalThis.__postgres = sql;
}

export default sql;
