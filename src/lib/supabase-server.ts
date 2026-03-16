import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Cookies } from '@sveltejs/kit';
import type { Database } from './database.types';

export function createServerSupabaseClient(cookies: Cookies) {
	return createServerClient<Database>(env.PUBLIC_SUPABASE_URL!, env.PUBLIC_SUPABASE_ANON_KEY!, {
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});
}
