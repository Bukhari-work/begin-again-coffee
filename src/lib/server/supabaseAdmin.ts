import { createClient } from "@supabase/supabase-js";
import { env } from "$env/dynamic/private";

// Initialize the admin client using the private SERVICE_ROLE_KEY.
// This client entirely bypasses Row Level Security (RLS). Use with extreme caution.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false, // No need to persist sessions on the server
	},
});
