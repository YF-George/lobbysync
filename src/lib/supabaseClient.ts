import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { browser } from '$app/environment';

// Configure auth options: only persist session in browser environment
const authOptions = {
	// persistSession must be true only in browser otherwise SSR can't access storage
	persistSession: browser,
	detectSessionInUrl: false
};

export const supabase = createClient(
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY,
	{ auth: authOptions }
);