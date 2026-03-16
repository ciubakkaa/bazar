import type { QuizAnswers } from './types';

const WEIGHTS = {
	sleep_schedule: 3,
	cleanliness: 4,
	noise_tolerance: 3,
	guests_frequency: 2,
	study_vs_social: 2,
	smoking: 8,
	pets: 3,
} as const;

const SCALE_FIELDS = [
	'sleep_schedule',
	'cleanliness',
	'noise_tolerance',
	'guests_frequency',
	'study_vs_social',
] as const;

const MAX_SCALE = 5;

export function calculateCompatibility(a: QuizAnswers, b: QuizAnswers): number | null {
	const aHasAnswers = SCALE_FIELDS.some((f) => a[f] !== null);
	const bHasAnswers = SCALE_FIELDS.some((f) => b[f] !== null);
	if (!aHasAnswers || !bHasAnswers) return null;

	let totalWeight = 0;
	let weightedScore = 0;

	for (const field of SCALE_FIELDS) {
		const aVal = a[field];
		const bVal = b[field];
		if (aVal === null || bVal === null) continue;

		const diff = Math.abs(aVal - bVal);
		const similarity = 1 - diff / (MAX_SCALE - 1);
		weightedScore += similarity * WEIGHTS[field];
		totalWeight += WEIGHTS[field];
	}

	if (a.smoking !== null && b.smoking !== null) {
		let similarity: number;
		if (a.smoking === b.smoking) similarity = 1;
		else if (
			(a.smoking === 0 && b.smoking === 2) ||
			(a.smoking === 2 && b.smoking === 0)
		)
			similarity = 0;
		else similarity = 0.3;
		weightedScore += similarity * WEIGHTS.smoking;
		totalWeight += WEIGHTS.smoking;
	}

	if (a.pets !== null && b.pets !== null) {
		const similarity = a.pets === b.pets ? 1 : 0.2;
		weightedScore += similarity * WEIGHTS.pets;
		totalWeight += WEIGHTS.pets;
	}

	if (totalWeight === 0) return null;
	return Math.round((weightedScore / totalWeight) * 100);
}
