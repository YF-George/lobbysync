import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

// Configure auth options: only persist session in browser environment
const authOptions = {
	// persistSession must be true only in browser otherwise SSR can't access storage
	persistSession: browser,
	detectSessionInUrl: false
};

// Use dynamic public env so builds don't fail when static exports are missing.
// Provide empty-string fallbacks to avoid runtime crashes; Vercel should still
// have these `PUBLIC_*` vars set in Project Settings for correct behaviour.
export const supabase = createClient(env.PUBLIC_SUPABASE_URL ?? '', env.PUBLIC_SUPABASE_ANON_KEY ?? '', {
	auth: authOptions
});
