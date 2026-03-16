import { describe, it, expect } from 'vitest';
import { calculateCompatibility } from '$lib/matching';
import type { QuizAnswers } from '$lib/types';

const base: QuizAnswers = {
	profile_id: 'a',
	sleep_schedule: 3,
	cleanliness: 4,
	noise_tolerance: 2,
	guests_frequency: 2,
	smoking: 0,
	pets: 0,
	study_vs_social: 3,
	updated_at: '',
};

describe('calculateCompatibility', () => {
	it('returns 100 for identical profiles', () => {
		expect(calculateCompatibility(base, { ...base, profile_id: 'b' })).toBe(100);
	});

	it('returns null if either has no answers', () => {
		const empty: QuizAnswers = {
			profile_id: 'b',
			sleep_schedule: null,
			cleanliness: null,
			noise_tolerance: null,
			guests_frequency: null,
			smoking: null,
			pets: null,
			study_vs_social: null,
			updated_at: '',
		};
		expect(calculateCompatibility(base, empty)).toBeNull();
	});

	it('penalizes smoking mismatch (0 vs 2) heavily', () => {
		const smoker = { ...base, profile_id: 'b', smoking: 2 };
		expect(calculateCompatibility(base, smoker)).toBeLessThan(70);
	});

	it('gives partial credit for adjacent smoking (0 vs 1)', () => {
		const outsideSmoker = { ...base, profile_id: 'b', smoking: 1 };
		const fullSmoker = { ...base, profile_id: 'c', smoking: 2 };
		const scoreOutside = calculateCompatibility(base, outsideSmoker)!;
		const scoreFull = calculateCompatibility(base, fullSmoker)!;
		expect(scoreOutside).toBeGreaterThan(scoreFull);
	});

	it('scores higher for similar cleanliness', () => {
		const clean = { ...base, profile_id: 'b', cleanliness: 4 };
		const messy = { ...base, profile_id: 'c', cleanliness: 1 };
		const scoreClean = calculateCompatibility(base, clean)!;
		const scoreMessy = calculateCompatibility(base, messy)!;
		expect(scoreClean).toBeGreaterThan(scoreMessy);
	});

	it('handles pets mismatch with low similarity', () => {
		const petOwner = { ...base, profile_id: 'b', pets: 1 };
		const noPets = { ...base, profile_id: 'a', pets: 0 };
		const score = calculateCompatibility(noPets, petOwner)!;
		expect(score).toBeLessThan(100);
		expect(score).toBeGreaterThan(0);
	});

	it('returns value between 0 and 100', () => {
		const opposite: QuizAnswers = {
			profile_id: 'b',
			sleep_schedule: 1,
			cleanliness: 1,
			noise_tolerance: 5,
			guests_frequency: 5,
			smoking: 2,
			pets: 1,
			study_vs_social: 1,
			updated_at: '',
		};
		const score = calculateCompatibility(base, opposite)!;
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});
});
