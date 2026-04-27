const enc = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret: string, data: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		enc.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
	return toBase64Url(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

export async function signBypassCookie(secret: string, ttlMs: number): Promise<string> {
	const expiresAt = Date.now() + ttlMs;
	const payload = String(expiresAt);
	const sig = await hmac(secret, payload);
	return `${payload}.${sig}`;
}

export async function verifyBypassCookie(
	secret: string,
	cookie: string | undefined | null
): Promise<boolean> {
	if (!cookie) return false;
	const dot = cookie.indexOf('.');
	if (dot <= 0 || dot === cookie.length - 1) return false;
	const payload = cookie.slice(0, dot);
	const sig = cookie.slice(dot + 1);
	const expiresAt = Number(payload);
	if (!Number.isFinite(expiresAt)) return false;
	if (expiresAt < Date.now()) return false;
	const expected = await hmac(secret, payload);
	return timingSafeEqual(sig, expected);
}

export const BYPASS_COOKIE_NAME = 'bazar_admin_bypass';
export const BYPASS_TTL_MS = 30 * 24 * 60 * 60 * 1000;
