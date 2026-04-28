import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ALLOWED = new Set(['ro', 'en']);

export const GET: RequestHandler = ({ url, cookies }) => {
	const to = url.searchParams.get('to') ?? 'ro';
	const requested = url.searchParams.get('redirect') ?? '/';
	const safeRedirect = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';

	if (!ALLOWED.has(to)) throw redirect(302, safeRedirect);

	cookies.set('PARAGLIDE_LOCALE', to, {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
		sameSite: 'lax'
	});

	throw redirect(302, safeRedirect);
};
