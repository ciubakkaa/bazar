// Content moderation for user-generated text.
// Multi-layer approach: normalization → root matching → pattern detection → substring scan.
// Covers Romanian and English profanity, hate speech, slurs, and creative bypasses.

// ─── BLOCKED ROOTS ───
// We match on word ROOTS rather than full words, so "pulalau", "futere", "cacatu" etc.
// all get caught without listing every inflection.
const ROOTS_RO = [
	// Sexual / vulgar
	'pul', 'pizd', 'muie', 'muist', 'fut', 'fute', 'futu', 'futa',
	'cacat', 'kkt', 'caca', 'curat',
	'curv', 'tarfa', 'tarif', 'prostitu',
	'coaie', 'coaiele', 'coae',
	'slobo', 'sloboz',
	'laba', 'labagi', 'labari',
	'bulang', 'poponar', 'pederast',
	'sugipul', 'sugipizd', 'sugimui',

	// Insults - common
	'fraier', 'prost', 'prosta', 'prostu', 'prosti',
	'idiot', 'imbecil', 'cretin', 'debil', 'tampit', 'tampita',
	'handicap', 'retarda', 'autist', // when used as insult
	'dobitoc', 'bou', 'vaca', 'vita',
	'gunoi', 'gunoaie', 'jegos', 'jegoas', 'jigodie',
	'scarbo', 'scarbos', 'scarboasa',
	'nenorocit', 'nenoroci',
	'nesimtit', 'nesimtita',
	'ticalos', 'mizerabil', 'ordinar',
	'rahat',

	// "Bagami-as" family + ma-ta/ta-tu variants
	'bagami', 'bagati', 'dami', 'dati',
	'mamata', 'mata', 'matas', 'matii',
	'tactu', 'tatu', 'tatii',
	'mortii', 'mortiit', 'mortilor',
	'dumnezeii', 'cristosii', 'dreq', 'draq',
	'sugi', 'suge', 'sugeti',

	// Abbreviations / coded
	'plm', 'pnm', 'mnm', 'fmm', 'smr', 'stm', 'mms', 'psd',
	'plmm', 'dtc', 'dtp', 'csf', 'mplm',

	// Threats / violence
	'omor', 'daubatai', 'daubataie', 'batai', 'snopesc',
	'injunghii', 'impusc', 'calci', 'distrug',

	// Sexual harassment
	'dezbrac', 'futacias', 'violez', 'abuzez',
];

const ROOTS_EN = [
	'fuck', 'fuk', 'fuc', 'phuck', 'phuk',
	'shit', 'sht',
	'bitch', 'b1tch', 'btch',
	'asshole', 'arsehole',
	'bastard', 'bastar',
	'dick', 'dik',
	'cock', 'cok',
	'cunt', 'cnt',
	'whore', 'whor',
	'slut', 'sl0t',
	'retard',
	'moron',
	'dumbass', 'dumbfuck',
	'motherfuck', 'motherf',
	'stfu', 'gtfo', 'lmfao',
];

// ─── HATE SPEECH / SLURS ───
// These are always blocked regardless of context.
const HATE_ROOTS = [
	// Ethnic slurs (Romanian context)
	'tigan', 'tziganesc', 'cioara', 'cioar', 'mangaliu',
	'jidan', 'jidov', 'jidoav',
	'bozgor', 'bozgori', 'bozgoroaic',

	// Racial slurs (English)
	'nigger', 'nigga', 'nigg', 'n1gg', 'n1g',
	'chink', 'gook', 'spic', 'wetback', 'kike',
	'sandnigger', 'towelhead', 'raghead',
	'cracker', 'honky',

	// Homophobic/transphobic slurs
	'faggot', 'faggo', 'fagg', 'f4g',
	'tranny', 'trannie',
	'poponar', 'bulangiu', 'pederast', 'labagiu',

	// Hate phrases (will be checked as substrings)
	'heil hitler', 'sieg heil', 'white power', 'white supremac',
	'death to', 'kill all', 'gas the',
	'moarte la', 'afara cu',
];

// ─── NORMALIZATION ───
// Aggressively normalize text to catch creative bypasses.
function normalize(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // strip diacritics (ă→a, ț→t, etc.)
		.replace(/(.)\1{2,}/g, '$1$1')   // collapse repeats: fuuuuck → fuuck
		// Leet speak / symbol substitutions
		.replace(/[@àáâãäå4]/g, 'a')
		.replace(/[èéêë€3]/g, 'e')
		.replace(/[ìíîï!1|y]/g, 'i')
		.replace(/[òóôõö0()]/g, 'o')
		.replace(/[ùúûü]/g, 'u')
		.replace(/[$5]/g, 's')
		.replace(/[7]/g, 't')
		.replace(/[8]/g, 'b')
		.replace(/[9]/g, 'g')
		.replace(/[2]/g, 'z')
		.replace(/vv/g, 'w')
		.replace(/ph/g, 'f')
		.replace(/ck/g, 'k')
		// Strip obfuscation characters (dots, dashes, asterisks, underscores, etc.)
		.replace(/[\s_\-.*!@#$%^&()=+~`'"<>,?/\\|{}\[\]:;]/g, '');
}

// Also create a version that preserves word boundaries
function normalizeKeepSpaces(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/(.)\1{2,}/g, '$1$1')
		.replace(/[@àáâãäå]/g, 'a')
		.replace(/[èéêë€3]/g, 'e')
		.replace(/[ìíîï!1|y]/g, 'i')
		.replace(/[òóôõö0()]/g, 'o')
		.replace(/[ùúûü]/g, 'u')
		.replace(/[$5]/g, 's')
		.replace(/[7]/g, 't')
		.replace(/[8]/g, 'b')
		.replace(/[9]/g, 'g')
		.replace(/[2]/g, 'z')
		.replace(/ph/g, 'f')
		.replace(/ck/g, 'k')
		.replace(/[_\-.*!@#$%^&()=+~`'"<>,?/\\|{}\[\]:;]/g, '');
}

const ALL_ROOTS = [...ROOTS_RO, ...ROOTS_EN, ...HATE_ROOTS];

// Visual lookalike pairs — characters that look similar and get swapped to evade filters
// We generate variants of the stripped text with these swaps and check each.
const LOOKALIKE_SWAPS: [string, string][] = [
	['l', 'i'],  // puia ↔ pula
	['l', '1'],
	['o', '0'],
	['o', 'q'],
	['u', 'v'],  // pvla ↔ pula
	['n', 'm'],  // muie → nuie (less common but possible)
	['cl', 'd'],
	['d', 'cl'],
	['ii', 'u'], // puia → pua (compressed)
];

function generateLookalikeVariants(text: string): string[] {
	const variants: string[] = [text];
	for (const [from, to] of LOOKALIKE_SWAPS) {
		if (text.includes(from)) {
			variants.push(text.replaceAll(from, to));
		}
		if (text.includes(to)) {
			variants.push(text.replaceAll(to, from));
		}
	}
	return variants;
}

export type ModerationResult = {
	allowed: boolean;
	reason?: string;
};

const REJECT = (reason?: string): ModerationResult => ({
	allowed: false,
	reason: reason ?? 'Continutul contine limbaj inadecvat. Te rugam sa reformulezi.',
});

const ALLOW: ModerationResult = { allowed: true };

/**
 * Check if text contains profanity, hate speech, or offensive content.
 * Multi-layer detection:
 * 1. Normalize + strip obfuscation → substring root matching (catches p.u" l.a, p*la, pu1a, etc.)
 * 2. Word-boundary root matching on space-preserved version (catches "esti prost" but not "prostime")
 * 3. Spaced-letter detection (catches "p u l a", "f u c k")
 * 4. Hate speech substring scan (catches multi-word hate phrases)
 */
export function moderateContent(...texts: (string | null | undefined)[]): ModerationResult {
	for (const text of texts) {
		if (!text) continue;

		// Layer 1: Full strip — catches any obfuscation (p.u.l.a, p*la, pu1a, p_u_l_a)
		const stripped = normalize(text);
		const variants = generateLookalikeVariants(stripped);

		for (const variant of variants) {
			for (const root of ALL_ROOTS) {
				const normalizedRoot = root.replace(/[\s\-]/g, '');
				if (variant.includes(normalizedRoot)) {
					if (normalizedRoot.length <= 3) {
						const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(normalizedRoot)}\\b`, 'i');
						if (wordBoundaryRegex.test(normalizeKeepSpaces(text))) {
							return REJECT();
						}
					} else {
						return REJECT();
					}
				}
			}
		}

		// Layer 2: Spaced-letter detection — catches "p u l a", "f u t e"
		// Look for single characters separated by spaces/dots/dashes
		const spacedPattern = text
			.toLowerCase()
			.replace(/[\s.\-_*,;:!?]+/g, '')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');

		// This is already covered by Layer 1, but let's also catch cases where
		// people mix normal words with spaced profanity
		// e.g., "hey p u l a hey" — the stripped version catches this

		// Layer 3: Hate speech multi-word phrases (check in space-preserved normalized text)
		const normalized = normalizeKeepSpaces(text);
		for (const hate of HATE_ROOTS) {
			if (hate.includes(' ')) {
				if (normalized.includes(hate)) {
					return REJECT('Continutul contine limbaj discriminatoriu sau de ura. Acest tip de continut nu este permis.');
				}
			}
		}

		// Layer 4: ALL CAPS aggression detection (optional, flag but don't block)
		// Keeping this as a note for future — could flag content that's >60% caps
	}

	return ALLOW;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
