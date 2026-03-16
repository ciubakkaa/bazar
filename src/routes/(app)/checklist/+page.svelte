<script lang="ts">
	import { createClient } from '$lib/supabase';
	import ChecklistItem from '$lib/components/ChecklistItem.svelte';
	import type { ChecklistItemWithProgress } from '$lib/types';

	let { data } = $props();

	let items: ChecklistItemWithProgress[] = $state([]);
	let activeCategory: string | null = $state(null);

	// Sync when server data changes (e.g. navigation, initial load)
	$effect(() => {
		items = data.items;
	});

	const supabase = createClient();

	const categories = $derived(() => {
		const cats = new Set(items.map((i) => i.category));
		return Array.from(cats);
	});

	const filteredItems = $derived(
		activeCategory ? items.filter((i) => i.category === activeCategory) : items
	);

	const completedCount = $derived(items.filter((i) => i.is_completed).length);
	const totalCount = $derived(items.length);
	const progressPercent = $derived(totalCount > 0 ? (completedCount / totalCount) * 100 : 0);

	const encouragingMessage = $derived(() => {
		if (completedCount === 0) return 'Hai sa incepem! Primul pas e mereu cel mai greu.';
		if (progressPercent < 30) return 'Bun inceput! Continua tot asa.';
		if (progressPercent < 60) return 'Esti pe drumul cel bun! Jumatate de drum.';
		if (progressPercent < 100) return 'Aproape gata! Mai sunt doar cateva lucruri.';
		return 'Felicitari! Ai completat tot checklist-ul! 🎉';
	});

	const categoryStyles: Record<string, string> = {
		documents: 'bg-blue-100 text-blue-800',
		housing: 'bg-green-100 text-green-800',
		registration: 'bg-purple-100 text-purple-800',
		campus: 'bg-amber-100 text-amber-800',
		transport: 'bg-cyan-100 text-cyan-800',
		health: 'bg-rose-100 text-rose-800',
	};

	const categoryLabels: Record<string, string> = {
		documents: 'Acte',
		housing: 'Cazare',
		registration: 'Înregistrare',
		campus: 'Campus',
		transport: 'Transport',
		health: 'Sănătate',
	};

	async function handleToggle(templateId: string) {
		const item = items.find((i) => i.id === templateId);
		if (!item) return;
		const newCompleted = !item.is_completed;

		// Optimistic update
		items = items.map((i) =>
			i.id === templateId ? { ...i, is_completed: newCompleted } : i
		);

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;

		await supabase.from('checklist_progress').upsert({
			profile_id: user.id,
			template_id: templateId,
			is_completed: newCompleted,
			completed_at: newCompleted ? new Date().toISOString() : null,
		});
	}
</script>

<div class="px-5 py-6 max-w-2xl mx-auto">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="font-heading font-bold text-2xl md:text-[28px] text-bazar-dark">Checklist-ul tău</h1>
		{#if data.profile?.faculty}
			<p class="text-sm text-bazar-gray-500 mt-1">
				{data.profile.faculty.university?.name ?? ''} &middot; {data.profile.faculty.name ?? ''}
			</p>
		{/if}
	</div>

	<!-- Progress card -->
	<div class="bg-white rounded-bazar-lg border-2 border-bazar-gray-100 p-4 md:p-6 mb-6">
		<div class="flex items-center justify-between mb-3">
			<span class="text-sm font-semibold text-bazar-dark">Progres</span>
			<span class="text-sm font-medium text-bazar-gray-500">{completedCount} din {totalCount}</span>
		</div>
		<div class="bg-bazar-gray-100 rounded-bazar-pill h-3 overflow-hidden">
			<div
				class="bg-gradient-to-r from-bazar-green to-emerald-400 h-full rounded-bazar-pill transition-all duration-500"
				style="width: {progressPercent}%"
			></div>
		</div>
		<p class="text-sm italic text-bazar-gray-500 mt-3">{encouragingMessage()}</p>
	</div>

	<!-- Category filters -->
	<div class="flex gap-2 overflow-x-auto pb-4 mb-4 -mx-5 px-5 scrollbar-hide">
		<button
			onclick={() => (activeCategory = null)}
			class="shrink-0 text-sm font-medium px-4 py-2 rounded-bazar-pill transition-colors
				{activeCategory === null
					? 'bg-bazar-dark text-white'
					: 'bg-white border-2 border-bazar-gray-200 text-bazar-gray-700 hover:border-bazar-gray-300'}"
		>
			Toate
		</button>
		{#each categories() as cat}
			<button
				onclick={() => (activeCategory = activeCategory === cat ? null : cat)}
				class="shrink-0 text-sm font-medium px-4 py-2 rounded-bazar-pill transition-colors
					{activeCategory === cat
						? 'bg-bazar-dark text-white'
						: 'bg-white border-2 border-bazar-gray-200 text-bazar-gray-700 hover:border-bazar-gray-300'}"
			>
				{categoryLabels[cat] ?? cat}
			</button>
		{/each}
	</div>

	<!-- Checklist items -->
	<div class="flex flex-col gap-3">
		{#each filteredItems as item (item.id)}
			<ChecklistItem
				id={item.id}
				title={item.title}
				description={item.description}
				category={item.category}
				deadline_description={item.deadline_description}
				url={item.url}
				is_completed={item.is_completed}
				onToggle={handleToggle}
			/>
		{/each}

		{#if filteredItems.length === 0}
			<div class="text-center py-12 text-bazar-gray-500">
				<p class="text-lg">Niciun element în această categorie.</p>
			</div>
		{/if}
	</div>
</div>
