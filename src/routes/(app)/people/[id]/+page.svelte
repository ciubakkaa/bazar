<script lang="ts">
	import CompatibilityBadge from '$lib/components/CompatibilityBadge.svelte';
	import { calculateCompatibility } from '$lib/matching';
	import { QUIZ_QUESTIONS } from '$lib/constants';
	import type { QuizAnswers } from '$lib/types';

	let { data } = $props();

	const person = $derived(data.person);
	const isVerified = $derived(!!data.profile?.is_verified);

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	const compatibilityScore = $derived(
		data.myQuiz && person?.quiz_answers
			? calculateCompatibility(data.myQuiz as QuizAnswers, person.quiz_answers as QuizAnswers)
			: null
	);

	// Compute per-dimension scores for visual breakdown
	const SCALE_FIELDS = [
		'sleep_schedule',
		'cleanliness',
		'noise_tolerance',
		'guests_frequency',
		'study_vs_social'
	] as const;

	const dimensionLabels: Record<string, string> = {
		sleep_schedule: 'Program somn',
		cleanliness: 'Curățenie',
		noise_tolerance: 'Toleranță zgomot',
		guests_frequency: 'Musafiri',
		study_vs_social: 'Studiu vs. social',
		smoking: 'Fumat',
		pets: 'Animale'
	};

	const dimensionBreakdown = $derived.by(() => {
		if (!data.myQuiz || !person?.quiz_answers) return [];
		const my = data.myQuiz as QuizAnswers;
		const their = person.quiz_answers as QuizAnswers;
		const dims: { key: string; label: string; myVal: number; theirVal: number; max: number }[] = [];

		for (const field of SCALE_FIELDS) {
			if (my[field] != null && their[field] != null) {
				dims.push({
					key: field,
					label: dimensionLabels[field] ?? field,
					myVal: my[field] as number,
					theirVal: their[field] as number,
					max: 5
				});
			}
		}

		return dims;
	});
</script>

{#if !person}
	<div class="px-5 py-12 text-center text-bazar-gray-500">
		<p class="text-lg">Profilul nu a fost găsit.</p>
		<a href="/people" class="text-sm text-bazar-dark underline mt-2 inline-block">&larr; Înapoi</a>
	</div>
{:else}
	<div class="px-5 py-6 max-w-2xl mx-auto">
		<!-- Back -->
		<a href="/people" class="inline-flex items-center gap-1 text-sm text-bazar-gray-500 hover:text-bazar-dark mb-6 transition-colors">
			&larr; Înapoi
		</a>

		<!-- Profile header -->
		<div class="flex items-start gap-4 mb-6">
			<div
				class="w-16 h-16 rounded-full bg-gradient-to-br from-bazar-purple to-bazar-orange flex items-center justify-center text-white font-bold text-lg shrink-0"
			>
				{getInitials(person.full_name)}
			</div>
			<div class="min-w-0">
				<h1 class="text-xl font-heading font-bold text-bazar-dark">{person.full_name}</h1>
				{#if person.faculty}
					<p class="text-sm text-bazar-gray-500">
						{person.faculty.name ?? person.faculty.short_name}
						{#if person.faculty.university}
							&middot; {person.faculty.university.name ?? person.faculty.university.short_name}
						{/if}
					</p>
				{/if}
				{#if person.home_city}
					<p class="text-xs text-bazar-gray-500 mt-0.5">{person.home_city}</p>
				{/if}
				<div class="mt-2">
					<CompatibilityBadge score={compatibilityScore} />
				</div>
			</div>
		</div>

		{#if !isVerified}
			<!-- Unverified: limited view -->
			<div class="bg-amber-50 border border-amber-200 rounded-bazar-md p-5 text-center">
				<p class="text-sm text-amber-800 mb-3">Verifică-te pentru a vedea profilul complet</p>
				<a
					href="/profile"
					class="inline-block px-5 py-2 text-sm font-medium bg-bazar-dark text-white rounded-bazar-sm hover:opacity-90 transition-opacity"
				>
					Verificare
				</a>
			</div>
		{:else}
			<!-- Bio -->
			{#if person.bio}
				<div class="mb-6">
					<h2 class="text-sm font-semibold text-bazar-dark mb-2">Despre</h2>
					<p class="text-sm text-bazar-gray-500 leading-relaxed break-words">{person.bio}</p>
				</div>
			{/if}

			<!-- Compatibility breakdown -->
			{#if dimensionBreakdown.length > 0}
				<div class="bg-white rounded-bazar-md border-2 border-bazar-gray-100 p-4 md:p-5 mb-6">
					<h2 class="text-sm font-semibold text-bazar-dark mb-4">Compatibilitate per dimensiune</h2>
					<div class="space-y-4">
						{#each dimensionBreakdown as dim}
							<div>
								<div class="flex items-center justify-between mb-1.5">
									<span class="text-xs font-medium text-bazar-dark">{dim.label}</span>
									<span class="text-xs text-bazar-gray-500">
										Tu: {dim.myVal} / Ei: {dim.theirVal}
									</span>
								</div>
								<div class="flex gap-1.5">
									<!-- My bar -->
									<div class="flex-1 h-2 bg-bazar-gray-100 rounded-bazar-pill overflow-hidden">
										<div
											class="h-full bg-bazar-purple rounded-bazar-pill transition-all"
											style="width: {(dim.myVal / dim.max) * 100}%"
										></div>
									</div>
									<!-- Their bar -->
									<div class="flex-1 h-2 bg-bazar-gray-100 rounded-bazar-pill overflow-hidden">
										<div
											class="h-full bg-bazar-orange rounded-bazar-pill transition-all"
											style="width: {(dim.theirVal / dim.max) * 100}%"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
					<div class="flex items-center gap-4 mt-4 text-xs text-bazar-gray-500">
						<span class="flex items-center gap-1.5">
							<span class="w-3 h-2 bg-bazar-purple rounded-sm inline-block"></span>
							Tu
						</span>
						<span class="flex items-center gap-1.5">
							<span class="w-3 h-2 bg-bazar-orange rounded-sm inline-block"></span>
							{person.full_name.split(' ')[0]}
						</span>
					</div>
				</div>
			{/if}

			<!-- Roommate preferences -->
			{#if person.roommate_preferences}
				{@const prefs = person.roommate_preferences}
				<div class="bg-white rounded-bazar-md border-2 border-bazar-gray-100 p-4 md:p-5 mb-6">
					<h2 class="text-sm font-semibold text-bazar-dark mb-3">Preferințe coleg de cameră</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
						{#if prefs.budget_min || prefs.budget_max}
							<div>
								<span class="text-bazar-gray-500">Buget:</span>
								<span class="text-bazar-dark font-medium">
									{prefs.budget_min ?? '?'}–{prefs.budget_max ?? '?'} EUR
								</span>
							</div>
						{/if}
						{#if prefs.preferred_sectors?.length}
							<div>
								<span class="text-bazar-gray-500">Zone:</span>
								<span class="text-bazar-dark font-medium">
									{prefs.preferred_sectors.join(', ')}
								</span>
							</div>
						{/if}
						{#if prefs.move_in_month}
							<div>
								<span class="text-bazar-gray-500">Mutare:</span>
								<span class="text-bazar-dark font-medium capitalize">{prefs.move_in_month}</span>
							</div>
						{/if}
						{#if prefs.has_apartment}
							<div>
								<span class="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-bazar-pill">
									Are apartament
								</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Message button -->
			<a
				href="/messages"
				class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-bazar-dark text-white rounded-bazar-sm hover:opacity-90 transition-opacity"
			>
				Trimite mesaj
			</a>
		{/if}
	</div>
{/if}
