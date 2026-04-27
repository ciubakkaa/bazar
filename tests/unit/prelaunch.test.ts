import { describe, it, expect } from 'vitest';
import { signBypassCookie, verifyBypassCookie } from '$lib/server/prelaunch';

const SECRET = 'test-secret-please-rotate';

describe('prelaunch bypass cookie', () => {
	it('round-trips a valid cookie', async () => {
		const cookie = await signBypassCookie(SECRET, 60_000);
		const result = await verifyBypassCookie(SECRET, cookie);
		expect(result).toBe(true);
	});

	it('rejects a tampered cookie', async () => {
		const cookie = await signBypassCookie(SECRET, 60_000);
		const tampered = cookie.replace(/.$/, (c) => (c === 'a' ? 'b' : 'a'));
		expect(await verifyBypassCookie(SECRET, tampered)).toBe(false);
	});

	it('rejects an expired cookie', async () => {
		const cookie = await signBypassCookie(SECRET, -1000);
		expect(await verifyBypassCookie(SECRET, cookie)).toBe(false);
	});

	it('rejects a cookie signed with a different secret', async () => {
		const cookie = await signBypassCookie(SECRET, 60_000);
		expect(await verifyBypassCookie('other-secret', cookie)).toBe(false);
	});

	it('rejects garbage input', async () => {
		expect(await verifyBypassCookie(SECRET, '')).toBe(false);
		expect(await verifyBypassCookie(SECRET, null)).toBe(false);
		expect(await verifyBypassCookie(SECRET, undefined)).toBe(false);
		expect(await verifyBypassCookie(SECRET, 'not-a-cookie')).toBe(false);
		expect(await verifyBypassCookie(SECRET, 'a.b')).toBe(false);
	});
});
