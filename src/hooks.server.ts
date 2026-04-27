import { createServerSupabaseClient } from '$lib/supabase-server';
import { isPublicPath } from '$lib/server/prelaunch-gate';
import { verifyBypassCookie, BYPASS_COOKIE_NAME } from '$lib/server/prelaunch';
import { env } from '$env/dynamic/private';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';

const supabaseHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerSupabaseClient(event.cookies);

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const prelaunchHandle: Handle = async ({ event, resolve }) => {
	const mode = env.LAUNCH_MODE ?? 'prelaunch';
	if (mode !== 'prelaunch') return resolve(event);

	const path = event.url.pathname;
	if (isPublicPath(path)) return resolve(event);

	const secret = env.PRELAUNCH_BYPASS_TOKEN;
	if (secret) {
		const cookie = event.cookies.get(BYPASS_COOKIE_NAME);
		if (await verifyBypassCookie(secret, cookie)) return resolve(event);
	}

	throw redirect(302, '/');
};

export const handle = sequence(prelaunchHandle, supabaseHandle);
