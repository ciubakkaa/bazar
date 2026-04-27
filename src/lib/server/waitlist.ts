export const ALLOWED_YEARS = ['pre_uni', '1', '2', '3', '4', '5', '6'] as const;
export type AllowedYear = (typeof ALLOWED_YEARS)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FEEDBACK_MAX = 1000;
const FREE_TEXT_MAX = 200;

export type WaitlistParsed = {
	email: string;
	university: string;
	faculty: string | null;
	year_of_study: AllowedYear;
	feedback: string | null;
	honeypotTriggered: boolean;
};

export type ValidationResult =
	| { ok: true; value: WaitlistParsed }
	| { ok: false; error: string };

function pick(form: Record<string, unknown>, key: string): string {
	const v = form[key];
	if (typeof v === 'string') return v;
	return '';
}

export function validateWaitlistInput(form: Record<string, unknown>): ValidationResult {
	const email = pick(form, 'email').trim().toLowerCase();
	const university = pick(form, 'university').trim().slice(0, FREE_TEXT_MAX);
	const facultyRaw = pick(form, 'faculty').trim().slice(0, FREE_TEXT_MAX);
	const year = pick(form, 'year_of_study').trim();
	const feedbackRaw = pick(form, 'feedback');
	const website = pick(form, 'website');

	if (!EMAIL_RE.test(email) || email.length > 254) {
		return { ok: false, error: 'Adresa de email pare invalida.' };
	}
	if (!university) {
		return { ok: false, error: 'Alege o universitate.' };
	}
	if (!(ALLOWED_YEARS as readonly string[]).includes(year)) {
		return { ok: false, error: 'Alege anul de studiu.' };
	}

	const feedback = feedbackRaw ? feedbackRaw.slice(0, FEEDBACK_MAX) : null;
	const faculty = facultyRaw ? facultyRaw : null;

	return {
		ok: true,
		value: {
			email,
			university,
			faculty,
			year_of_study: year as AllowedYear,
			feedback,
			honeypotTriggered: website.trim().length > 0
		}
	};
}

export async function hashIp(ip: string, secret: string): Promise<string> {
	const data = new TextEncoder().encode(`${ip}|${secret}`);
	const buf = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}
