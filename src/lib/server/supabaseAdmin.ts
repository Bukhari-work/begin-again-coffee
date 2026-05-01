import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";
import { env } from "$env/dynamic/private";

// Initialize the admin client using the private SERVICE_ROLE_KEY.
// This client entirely bypasses Row Level Security (RLS). Use with extreme caution.
export const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false, // No need to persist sessions on the server
	},
});
