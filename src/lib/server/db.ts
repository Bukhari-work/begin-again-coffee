import postgres from "postgres";
import { env } from "$env/dynamic/private";
import { dev } from "$app/environment";

if (!env.POSTGRES_URL) {
	throw new Error("POSTGRES_URL environment variable is missing");
}

let connectionString = env.POSTGRES_URL;

// Safer URL handling
if (!dev) {
	const url = new URL(connectionString);
	url.searchParams.set("pgbouncer", "true");
	connectionString = url.toString();
}

declare global {
	var __postgres: ReturnType<typeof postgres> | undefined;
}

const sql =
	globalThis.__postgres ??
	postgres(connectionString, {
		max: dev ? 10 : 4,

		// IMPORTANT: must be false in production for Supavisor
		prepare: dev,

		idle_timeout: dev ? 20 : 1,
		connect_timeout: 5,

		ssl: !dev ? "require" : undefined,
	});

if (dev) {
	globalThis.__postgres = sql;
}

export default sql;
