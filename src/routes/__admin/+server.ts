import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { signBypassCookie, BYPASS_COOKIE_NAME, BYPASS_TTL_MS } from '$lib/server/prelaunch';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const secret = env.PRELAUNCH_BYPASS_TOKEN;
	if (!secret) throw error(404, 'Not found');

	const provided = url.searchParams.get('token') ?? '';
	if (provided.length !== secret.length) throw error(404, 'Not found');
	let diff = 0;
	for (let i = 0; i < secret.length; i++) {
		diff |= provided.charCodeAt(i) ^ secret.charCodeAt(i);
	}
	if (diff !== 0) throw error(404, 'Not found');

	const cookieValue = await signBypassCookie(secret, BYPASS_TTL_MS);
	cookies.set(BYPASS_COOKIE_NAME, cookieValue, {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: Math.floor(BYPASS_TTL_MS / 1000)
	});

	throw redirect(302, '/admin');
};
