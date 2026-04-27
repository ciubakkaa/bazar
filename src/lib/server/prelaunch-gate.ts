const STATIC_PREFIXES = ['/_app/', '/favicon.'];
const PUBLIC_EXACT = new Set(['/', '/api/locale', '/__admin']);

export function isPublicPath(pathname: string): boolean {
	if (PUBLIC_EXACT.has(pathname)) return true;
	for (const prefix of STATIC_PREFIXES) {
		if (pathname.startsWith(prefix)) return true;
	}
	return false;
}
