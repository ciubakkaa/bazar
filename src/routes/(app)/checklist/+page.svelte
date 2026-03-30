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

	const categoryMeta: Record<string, { label: string; icon: string; bg: string; text: string; fill: string }> = {
		documents: { label: 'Acte', icon: '📄', bg: 'bg-blue-50', text: 'text-blue-800', fill: 'bg-blue-400' },
		housing: { label: 'Cazare', icon: '🏠', bg: 'bg-green-50', text: 'text-green-800', fill: 'bg-green-400' },
		registration: { label: 'Înregistrare', icon: '📝', bg: 'bg-purple-50', text: 'text-purple-800', fill: 'bg-purple-400' },
		campus: { label: 'Campus', icon: '🏫', bg: 'bg-amber-50', text: 'text-amber-800', fill: 'bg-amber-400' },
		transport: { label: 'Transport', icon: '🚌', bg: 'bg-cyan-50', text: 'text-cyan-800', fill: 'bg-cyan-400' },
		health: { label: 'Sănătate', icon: '🏥', bg: 'bg-rose-50', text: 'text-rose-800', fill: 'bg-rose-400' },
	};

	const categoryLabels: Record<string, string> = Object.fromEntries(
		Object.entries(categoryMeta).map(([k, v]) => [k, v.label])
	);

	const categoryStats = $derived(() => {
		const stats: Record<string, { completed: number; total: number }> = {};
		for (const item of items) {
			if (!stats[item.category]) stats[item.category] = { completed: 0, total: 0 };
			stats[item.category].total++;
			if (item.is_completed) stats[item.category].completed++;
		}
		return stats;
	});

	const circumference = 2 * Math.PI * 54;
	const strokeDashoffset = $derived(circumference - (progressPercent / 100) * circumference);

	function getFirstName(name: string | undefined | null): string {
		if (!name) return 'Student';
		return name.split(' ')[0];
	}

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
	<!-- Header with greeting + progress ring -->
	<div class="flex items-center gap-6 mb-6">
		<div class="flex-1">
			<h1 class="font-heading font-bold text-2xl md:text-[28px] text-bazar-dark mb-1">
				Salut, {getFirstName(data.profile?.full_name)}!
			</h1>
			<p class="text-sm text-bazar-gray-500">{encouragingMessage()}</p>
			{#if data.profile?.faculty}
				<p class="text-xs text-bazar-gray-500 mt-1">
					{data.profile.faculty.university?.name ?? ''} &middot; {data.profile.faculty.name ?? ''}
				</p>
			{/if}
		</div>
		<!-- Circular progress ring -->
		<div class="relative shrink-0 w-[120px] h-[120px]">
			<svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
				<circle cx="60" cy="60" r="54" fill="none" stroke-width="8" class="stroke-bazar-gray-100" />
				<circle
					cx="60" cy="60" r="54" fill="none" stroke-width="8"
					stroke-linecap="round"
					class="stroke-bazar-green transition-all duration-700"
					style="stroke-dasharray: {circumference}; stroke-dashoffset: {strokeDashoffset}"
				/>
			</svg>
			<div class="absolute inset-0 flex flex-col items-center justify-center">
				<span class="font-heading font-bold text-xl text-bazar-dark">{completedCount}/{totalCount}</span>
				<span class="text-[11px] text-bazar-gray-500">completate</span>
			</div>
		</div>
	</div>

	<!-- Bento category grid -->
	<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
		<button
			onclick={() => (activeCategory = null)}
			class="rounded-bazar-lg p-3 text-left transition-all hover:scale-[1.02]
				{activeCategory === null
					? 'bg-bazar-yellow ring-2 ring-bazar-yellow-dim'
					: 'bg-white hover:bg-bazar-gray-100'}"
		>
			<span class="text-lg">🎯</span>
			<div class="font-semibold text-sm text-bazar-dark mt-1">Toate</div>
			<div class="text-xs text-bazar-gray-500">{completedCount}/{totalCount}</div>
			<div class="mt-2 h-1.5 rounded-full bg-bazar-gray-100 overflow-hidden">
				<div class="h-full rounded-full bg-bazar-green transition-all duration-500" style="width: {progressPercent}%"></div>
			</div>
		</button>
		{#each categories() as cat}
			{@const meta = categoryMeta[cat]}
			{@const stats = categoryStats()}
			{@const catStats = stats[cat] ?? { completed: 0, total: 0 }}
			{@const catPercent = catStats.total > 0 ? (catStats.completed / catStats.total) * 100 : 0}
			<button
				onclick={() => (activeCategory = activeCategory === cat ? null : cat)}
				class="rounded-bazar-lg p-3 text-left transition-all hover:scale-[1.02]
					{activeCategory === cat
						? 'bg-bazar-yellow ring-2 ring-bazar-yellow-dim'
						: (meta?.bg ?? 'bg-white') + ' hover:bg-bazar-gray-100'}"
			>
				<span class="text-lg">{meta?.icon ?? '📁'}</span>
				<div class="font-semibold text-sm text-bazar-dark mt-1">{meta?.label ?? cat}</div>
				<div class="text-xs text-bazar-gray-500">{catStats.completed}/{catStats.total}</div>
				<div class="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden">
					<div class="h-full rounded-full transition-all duration-500 {meta?.fill ?? 'bg-bazar-green'}" style="width: {catPercent}%"></div>
				</div>
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
