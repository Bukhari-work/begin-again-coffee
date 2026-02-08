import postgres from "postgres";
import { DATABASE_URL } from "$env/static/private";

// This creates a singleton connection pool
const sql = postgres(DATABASE_URL, {
	max: 10, // max connections
	idle_timeout: 20, // idle connection timeout
});

export default sql;
