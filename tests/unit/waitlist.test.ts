import { describe, it, expect } from 'vitest';
import { validateWaitlistInput, hashIp, ALLOWED_YEARS } from '$lib/server/waitlist';

describe('validateWaitlistInput', () => {
	const valid = {
		email: 'student@example.com',
		university: 'UPB — Universitatea Politehnica',
		faculty: 'Automatica si Calculatoare',
		year_of_study: '1',
		feedback: '',
		website: ''
	};

	it('accepts a valid submission', () => {
		const r = validateWaitlistInput(valid);
		expect(r.ok).toBe(true);
	});

	it('rejects bad email', () => {
		const r = validateWaitlistInput({ ...valid, email: 'not-an-email' });
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/email/i);
	});

	it('rejects empty university', () => {
		const r = validateWaitlistInput({ ...valid, university: '' });
		expect(r.ok).toBe(false);
	});

	it('rejects unknown year', () => {
		const r = validateWaitlistInput({ ...valid, year_of_study: '99' });
		expect(r.ok).toBe(false);
	});

	it('accepts pre_uni year', () => {
		const r = validateWaitlistInput({ ...valid, year_of_study: 'pre_uni' });
		expect(r.ok).toBe(true);
	});

	it('flags honeypot', () => {
		const r = validateWaitlistInput({ ...valid, website: 'http://spam.com' });
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.value.honeypotTriggered).toBe(true);
	});

	it('truncates feedback over 1000 chars', () => {
		const long = 'x'.repeat(2000);
		const r = validateWaitlistInput({ ...valid, feedback: long });
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.value.feedback?.length).toBe(1000);
	});

	it('exposes ALLOWED_YEARS', () => {
		expect(ALLOWED_YEARS).toContain('pre_uni');
		expect(ALLOWED_YEARS).toContain('1');
		expect(ALLOWED_YEARS).toContain('6');
	});
});

describe('hashIp', () => {
	it('produces a stable hex string', async () => {
		const a = await hashIp('1.2.3.4', 'secret');
		const b = await hashIp('1.2.3.4', 'secret');
		expect(a).toBe(b);
		expect(a).toMatch(/^[0-9a-f]{64}$/);
	});

	it('different secrets give different hashes', async () => {
		const a = await hashIp('1.2.3.4', 's1');
		const b = await hashIp('1.2.3.4', 's2');
		expect(a).not.toBe(b);
	});
});
