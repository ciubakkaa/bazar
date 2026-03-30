<script lang="ts">
	let {
		id,
		title,
		description,
		category,
		deadline_description,
		url,
		is_completed,
		onToggle,
	}: {
		id: string;
		title: string;
		description: string | null;
		category: string;
		deadline_description: string | null;
		url: string | null;
		is_completed: boolean;
		onToggle: (id: string) => void;
	} = $props();

	let expanded = $state(false);

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
</script>

<div
	class="bg-white rounded-bazar-lg p-4 transition-all
		{is_completed ? 'opacity-55 hover:opacity-75' : 'hover:shadow-[0_4px_24px_rgba(44,47,48,0.05)]'}"
>
	<div class="flex items-start gap-3">
		<!-- Checkbox -->
		<button
			onclick={() => onToggle(id)}
			class="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors
				{is_completed
					? 'bg-bazar-green border-bazar-green text-white'
					: 'border-2 border-bazar-gray-300 hover:border-bazar-gray-500'}"
			aria-label={is_completed ? 'Marchează ca neterminat' : 'Marchează ca terminat'}
		>
			{#if is_completed}
				<span class="text-sm font-bold">&#10003;</span>
			{/if}
		</button>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 flex-wrap">
				<span
					class="font-semibold text-[15px] {is_completed ? 'line-through text-bazar-gray-500' : 'text-bazar-dark'}"
				>
					{title}
				</span>
				<span
					class="text-[11px] font-semibold px-2.5 py-0.5 rounded-bazar-pill {categoryStyles[category] ?? 'bg-gray-100 text-gray-800'}"
				>
					{categoryLabels[category] ?? category}
				</span>
			</div>
			{#if deadline_description}
				<p class="text-xs text-bazar-gray-500 mt-1">{deadline_description}</p>
			{/if}

			<!-- Expanded details -->
			{#if expanded && (description || url)}
				<div class="mt-3 pt-3 bg-bazar-offwhite -mx-4 -mb-4 px-4 py-3 rounded-b-bazar-lg">
					{#if description}
						<p class="text-sm text-bazar-gray-700 leading-relaxed">{description}</p>
					{/if}
					{#if url}
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-block mt-2 text-sm font-medium text-bazar-purple hover:underline"
						>
							Link util &rarr;
						</a>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Expand/collapse -->
		{#if description || url}
			<button
				onclick={() => (expanded = !expanded)}
				class="mt-1 text-bazar-gray-500 hover:text-bazar-dark transition-transform shrink-0
					{expanded ? 'rotate-180' : ''}"
				aria-label={expanded ? 'Restrânge' : 'Expandează'}
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 20 20">
					<path
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M5 7.5L10 12.5L15 7.5"
					/>
				</svg>
			</button>
		{/if}
	</div>
</div>
