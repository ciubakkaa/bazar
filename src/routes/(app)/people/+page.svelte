<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import ProfileCard from '$lib/components/ProfileCard.svelte';
	import FilterDrawer from '$lib/components/FilterDrawer.svelte';
	import { calculateCompatibility } from '$lib/matching';
	import type { QuizAnswers } from '$lib/types';

	let { data } = $props();

	let filterOpen = $state(false);

	const activeTab = $derived(page.url.searchParams.get('tab') ?? 'all');

	function setTab(tab: string) {
		const params = new URLSearchParams(page.url.searchParams);
		if (tab === 'all') {
			params.delete('tab');
		} else {
			params.set('tab', tab);
		}
		const qs = params.toString();
		goto(`/people${qs ? `?${qs}` : ''}`, { replaceState: true });
	}

	// Compute compatibility for each person
	const peopleWithScores = $derived(
		(data.people ?? []).map((person: any) => ({
			...person,
			compatibility_score:
				data.myQuiz && person.quiz_answers
					? calculateCompatibility(data.myQuiz as QuizAnswers, person.quiz_answers as QuizAnswers)
					: null
		}))
	);

	// Apply filters from URL
	const filteredPeople = $derived.by(() => {
		let result = peopleWithScores;

		// Tab filter
		if (activeTab === 'roommate') {
			result = result.filter((p: any) => p.roommate_preferences);
		}

		// Budget filters
		const budgetMin = page.url.searchParams.get('budget_min');
		const budgetMax = page.url.searchParams.get('budget_max');
		if (budgetMin) {
			result = result.filter(
				(p: any) => p.roommate_preferences?.budget_max >= Number(budgetMin)
			);
		}
		if (budgetMax) {
			result = result.filter(
				(p: any) => p.roommate_preferences?.budget_min <= Number(budgetMax)
			);
		}

		// Sectors
		const sectors = page.url.searchParams.get('sectors');
		if (sectors) {
			const sectorList = sectors.split(',');
			result = result.filter((p: any) =>
				p.roommate_preferences?.preferred_sectors?.some((s: string) => sectorList.includes(s))
			);
		}

		// Move-in month
		const moveIn = page.url.searchParams.get('move_in');
		if (moveIn) {
			result = result.filter((p: any) => p.roommate_preferences?.move_in_month === moveIn);
		}

		// Gender
		const gender = page.url.searchParams.get('gender');
		if (gender) {
			result = result.filter(
				(p: any) =>
					!p.roommate_preferences?.gender_preference ||
					p.roommate_preferences.gender_preference === gender
			);
		}

		// Has apartment
		const hasApartment = page.url.searchParams.get('has_apartment');
		if (hasApartment === 'true') {
			result = result.filter((p: any) => p.roommate_preferences?.has_apartment === true);
		}

		// Sort: roommate tab sorts by compatibility desc
		if (activeTab === 'roommate') {
			result = [...result].sort(
				(a: any, b: any) => (b.compatibility_score ?? -1) - (a.compatibility_score ?? -1)
			);
		}

		return result;
	});

	const hasQuiz = $derived(!!data.myQuiz);
	const isVerified = $derived(!!data.profile?.is_verified);
</script>

<div class="px-5 py-6 max-w-3xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-heading font-bold text-bazar-dark">Oameni</h1>
		<button
			onclick={() => (filterOpen = true)}
			class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-bazar-dark bg-bazar-gray-100 rounded-bazar-sm hover:bg-bazar-gray-200 transition-colors"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
			</svg>
			Filtre
		</button>
	</div>

	<!-- Banners -->
	{#if !isVerified}
		<a
			href="/profile"
			class="block mb-4 px-4 py-3 bg-amber-50 rounded-bazar-sm text-sm text-amber-800"
		>
			Verifică-te pentru a apărea în listări și a trimite mesaje &rarr;
		</a>
	{/if}

	{#if !hasQuiz}
		<a
			href="/quiz"
			class="block mb-4 px-4 py-3 bg-bazar-yellow/20 rounded-bazar-sm text-sm text-bazar-dark"
		>
			Completează quiz-ul pentru a vedea compatibilitatea &rarr;
		</a>
	{/if}

	<!-- Tab switcher -->
	<div class="flex gap-1 mb-6 bg-bazar-gray-100 rounded-full p-1">
		<button
			onclick={() => setTab('all')}
			class="flex-1 py-2 text-sm font-semibold rounded-full transition-colors
				{activeTab === 'all'
					? 'bg-bazar-yellow text-bazar-dark'
					: 'text-bazar-gray-500 hover:text-bazar-dark'}"
		>
			Toți
		</button>
		<button
			onclick={() => setTab('roommate')}
			class="flex-1 py-2 text-sm font-semibold rounded-full transition-colors
				{activeTab === 'roommate'
					? 'bg-bazar-yellow text-bazar-dark'
					: 'text-bazar-gray-500 hover:text-bazar-dark'}"
		>
			Caută coleg de cameră
		</button>
	</div>

	<!-- People grid -->
	{#if filteredPeople.length === 0}
		<div class="text-center py-12 text-bazar-gray-500">
			<p class="text-lg mb-1">Nimeni nu corespunde filtrelor</p>
			<p class="text-sm">Încearcă să modifici criteriile de căutare.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			{#each filteredPeople as person (person.id)}
				<ProfileCard {person} />
			{/each}
		</div>
	{/if}
</div>

<FilterDrawer open={filterOpen} onClose={() => (filterOpen = false)} />
