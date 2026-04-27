import { describe, it, expect } from 'vitest';
import { isPublicPath } from '$lib/server/prelaunch-gate';

describe('isPublicPath', () => {
	it('allows the root', () => {
		expect(isPublicPath('/')).toBe(true);
	});

	it('allows the locale switch endpoint', () => {
		expect(isPublicPath('/api/locale')).toBe(true);
	});

	it('allows the admin bypass entrypoint', () => {
		expect(isPublicPath('/__admin')).toBe(true);
	});

	it('allows static assets', () => {
		expect(isPublicPath('/_app/immutable/chunks/foo.js')).toBe(true);
		expect(isPublicPath('/favicon.ico')).toBe(true);
		expect(isPublicPath('/favicon.svg')).toBe(true);
	});

	it('blocks app routes', () => {
		expect(isPublicPath('/login')).toBe(false);
		expect(isPublicPath('/register')).toBe(false);
		expect(isPublicPath('/checklist')).toBe(false);
		expect(isPublicPath('/qa')).toBe(false);
		expect(isPublicPath('/admin')).toBe(false);
		expect(isPublicPath('/admin/anything')).toBe(false);
	});
});
