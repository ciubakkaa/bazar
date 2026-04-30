import { fail, redirect, type Actions } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { validateWaitlistInput, hashIp } from '$lib/server/waitlist';
import type { PageServerLoad } from './$types';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

export const load: PageServerLoad = async ({ parent }) => {
	const mode = env.LAUNCH_MODE ?? 'prelaunch';
	if (mode !== 'prelaunch') {
		const { profile } = await parent();
		if (profile) redirect(303, '/checklist');
	}
	return {};
};

export const actions: Actions = {
	waitlist: async ({ request, locals, getClientAddress, cookies }) => {
		try {
			const fd = await request.formData();
			const raw: Record<string, string> = {};
			for (const [k, v] of fd.entries()) {
				if (typeof v === 'string') raw[k] = v;
			}

			const result = validateWaitlistInput(raw);
			if (!result.ok) {
				return fail(400, { error: result.error, fields: raw });
			}
			const v = result.value;

			if (v.honeypotTriggered) {
				return { success: true, email: v.email };
			}

			const locale = cookies.get('PARAGLIDE_LOCALE') === 'en' ? 'en' : 'ro';
			const userAgent = (request.headers.get('user-agent') ?? '').slice(0, 500);
			const ipSecret = env.IP_HASH_SECRET ?? 'dev-only-rotate-me';

			let ip = '0.0.0.0';
			try {
				ip = getClientAddress();
			} catch (err) {
				console.error('getClientAddress failed', err);
			}
			const ip_hash = await hashIp(ip, ipSecret);

			if (env.IP_HASH_SECRET) {
				const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
				const { count, error: countErr } = await locals.supabase
					.from('waitlist_signups')
					.select('id', { head: true, count: 'exact' })
					.eq('ip_hash', ip_hash)
					.gte('created_at', since);
				if (countErr) console.error('rate-limit count failed', countErr);
				if ((count ?? 0) >= RATE_LIMIT_MAX) {
					return fail(429, { error: 'Prea multe inregistrari. Reincearca mai tarziu.' });
				}
			}

			const { error } = await locals.supabase.from('waitlist_signups').insert({
				email: v.email,
				university: v.university,
				faculty: v.faculty,
				year_of_study: v.year_of_study,
				feedback: v.feedback,
				locale,
				user_agent: userAgent || null,
				ip_hash
			});

			if (error && error.code !== '23505') {
				console.error('waitlist insert failed', JSON.stringify(error));
				return fail(500, { error: 'Ceva nu a mers. Incearca din nou.' });
			}

			if (!error) {
				void sendSignupPing(v).catch((err) => console.error('resend ping failed', err));
			}

			return { success: true, email: v.email };
		} catch (err) {
			console.error('waitlist action threw', err instanceof Error ? err.stack : err);
			return fail(500, { error: 'Ceva nu a mers. Incearca din nou.' });
		}
	}
};

async function sendSignupPing(v: {
	email: string;
	university: string;
	faculty: string | null;
	year_of_study: string;
	feedback: string | null;
}) {
	const apiKey = env.RESEND_API_KEY;
	const to = env.WAITLIST_NOTIFY_EMAIL;
	const from = env.WAITLIST_NOTIFY_FROM ?? 'Bazar <bazar@hicode.ro>';
	if (!apiKey || !to) return;

	const lines = [
		`Email: ${v.email}`,
		`Universitate: ${v.university}`,
		v.faculty ? `Facultate: ${v.faculty}` : null,
		`An: ${v.year_of_study}`,
		v.feedback ? `\nFeedback:\n${v.feedback}` : null
	].filter(Boolean);

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from,
			to,
			subject: `[Bazar] Nou pe lista: ${v.email}`,
			text: lines.join('\n')
		})
	});
	if (!res.ok) {
		console.error('resend non-200', await res.text());
	}
}
