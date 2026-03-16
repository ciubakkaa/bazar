<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import QuestionCard from '$lib/components/QuestionCard.svelte';

	let { data } = $props();

	const activeTab = $derived(page.url.searchParams.get('tab') ?? 'all');
	const isVerified = $derived(!!data.profile?.is_verified);

	function setTab(tab: string) {
		const params = new URLSearchParams(page.url.searchParams);
		if (tab === 'all') {
			params.delete('tab');
		} else {
			params.set('tab', tab);
		}
		const qs = params.toString();
		goto(`/qa${qs ? `?${qs}` : ''}`, { replaceState: true });
	}

	const filteredQuestions = $derived.by(() => {
		const questions = data.questions ?? [];
		if (activeTab === 'faculty') {
			return questions.filter((q: any) => q.faculty_id === data.userFacultyId);
		}
		if (activeTab === 'general') {
			return questions.filter((q: any) => !q.faculty_id);
		}
		return questions;
	});
</script>

<div class="px-5 py-6 max-w-3xl mx-auto">
	<!-- Header -->
	<h1 class="text-2xl font-heading font-bold text-bazar-dark mb-6">Intrebari</h1>

	<!-- Verification banner -->
	{#if !isVerified}
		<a
			href="/profile"
			class="block mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-bazar-sm text-sm text-amber-800"
		>
			Verifica-te pentru a pune intrebari &rarr;
		</a>
	{/if}

	<!-- Tab switcher -->
	<div class="flex gap-1 mb-6 bg-bazar-gray-100 rounded-bazar-pill p-1">
		<button
			onclick={() => setTab('all')}
			class="flex-1 py-2 text-sm font-medium rounded-bazar-pill transition-colors
				{activeTab === 'all'
					? 'bg-white text-bazar-dark shadow-sm'
					: 'text-bazar-gray-500 hover:text-bazar-dark'}"
		>
			Toate
		</button>
		<button
			onclick={() => setTab('faculty')}
			class="flex-1 py-2 text-sm font-medium rounded-bazar-pill transition-colors
				{activeTab === 'faculty'
					? 'bg-white text-bazar-dark shadow-sm'
					: 'text-bazar-gray-500 hover:text-bazar-dark'}"
		>
			Facultatea mea
		</button>
		<button
			onclick={() => setTab('general')}
			class="flex-1 py-2 text-sm font-medium rounded-bazar-pill transition-colors
				{activeTab === 'general'
					? 'bg-white text-bazar-dark shadow-sm'
					: 'text-bazar-gray-500 hover:text-bazar-dark'}"
		>
			Generale
		</button>
	</div>

	<!-- Questions list -->
	{#if filteredQuestions.length === 0}
		<div class="text-center py-12 text-bazar-gray-500">
			<p class="text-lg mb-1">Nicio intrebare inca</p>
			<p class="text-sm">Fii primul care pune o intrebare!</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredQuestions as question (question.id)}
				<QuestionCard {question} />
			{/each}
		</div>
	{/if}
</div>

<!-- Floating ask button -->
{#if isVerified}
	<a
		href="/qa/ask"
		class="fixed bottom-24 right-5 md:bottom-8 md:right-8 bg-bazar-dark text-white rounded-full shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2 z-30"
	>
		<span class="flex items-center justify-center w-14 h-14 md:hidden text-2xl font-bold">+</span>
		<span class="hidden md:flex items-center gap-2 px-6 py-3.5 text-sm font-medium">
			<span class="text-lg leading-none">+</span>
			Intreaba
		</span>
	</a>
{/if}
