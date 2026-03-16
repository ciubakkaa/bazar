import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Database } from './database.types';

export function createClient() {
	return createBrowserClient<Database>(env.PUBLIC_SUPABASE_URL!, env.PUBLIC_SUPABASE_ANON_KEY!);
}
