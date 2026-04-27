<script lang="ts">
	import { bucharestUniversities, type UniversityGroup } from '$lib/data/bucharest-universities';

	type Props = {
		university?: string;
		faculty?: string;
		placeholder?: string;
		altaPlaceholder?: string;
		altaOptionLabel?: string;
	};

	let {
		university = $bindable(''),
		faculty = $bindable(''),
		placeholder = 'Cauta facultatea sau universitatea',
		altaPlaceholder = 'Scrie aici facultatea ta',
		altaOptionLabel = 'Alta facultate (zi-ne care)'
	}: Props = $props();

	let open = $state(false);
	let query = $state('');
	let inputEl: HTMLInputElement | null = $state(null);
	let altaText = $state('');
	let containerEl: HTMLDivElement | null = $state(null);

	let displayLabel = $derived.by(() => {
		if (university === '__alta__') return altaText ? `Alta: ${altaText}` : 'Alta facultate';
		if (faculty) return `${faculty} — ${university}`;
		if (university) return university;
		return '';
	});

	type Item =
		| { type: 'header'; group: UniversityGroup }
		| { type: 'faculty'; group: UniversityGroup; faculty: string }
		| { type: 'alta' };

	let filtered = $derived.by<Item[]>(() => {
		const q = query.trim().toLowerCase();
		const items: Item[] = [];
		for (const group of bucharestUniversities) {
			const groupMatches =
				q === '' ||
				group.name.toLowerCase().includes(q) ||
				(group.short ?? '').toLowerCase().includes(q);
			const matchedFaculties =
				q === '' ? group.faculties : group.faculties.filter((f) => f.toLowerCase().includes(q));
			if (groupMatches || matchedFaculties.length > 0) {
				items.push({ type: 'header', group });
				const facsToShow =
					groupMatches && matchedFaculties.length === 0 ? group.faculties : matchedFaculties;
				for (const f of facsToShow) items.push({ type: 'faculty', group, faculty: f });
			}
		}
		items.push({ type: 'alta' });
		return items;
	});

	function selectFaculty(group: UniversityGroup, fac: string) {
		university = group.name;
		faculty = fac;
		query = '';
		open = false;
	}

	function selectAlta() {
		university = '__alta__';
		faculty = '';
		query = '';
		open = false;
		setTimeout(() => document.getElementById('alta-input')?.focus(), 0);
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
			inputEl?.blur();
		}
	}

	function clear() {
		university = '';
		faculty = '';
		altaText = '';
		query = '';
		open = true;
		inputEl?.focus();
	}

	function handleWindowClick(e: MouseEvent) {
		if (!containerEl) return;
		if (!containerEl.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div bind:this={containerEl} class="relative">
	<div class="relative">
		<input
			bind:this={inputEl}
			type="text"
			class="w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors"
			{placeholder}
			value={open ? query : displayLabel}
			onfocus={() => (open = true)}
			oninput={(e) => {
				open = true;
				query = e.currentTarget.value;
				if (university && university !== '__alta__') {
					university = '';
					faculty = '';
				}
			}}
			onkeydown={handleKey}
			autocomplete="off"
		/>
		{#if displayLabel && !open}
			<button
				type="button"
				class="absolute right-3 top-1/2 -translate-y-1/2 text-bazar-gray-500 hover:text-bazar-dark text-lg leading-none"
				onclick={clear}
				aria-label="Sterge"
			>×</button>
		{/if}
	</div>

	{#if open}
		<div
			class="absolute z-30 mt-1 w-full bg-white rounded-bazar-sm border border-bazar-gray-200 shadow-[0_8px_40px_rgba(44,47,48,0.08)] max-h-72 overflow-y-auto"
		>
			{#each filtered as item (item.type === 'faculty' ? item.group.name + '|' + item.faculty : item.type === 'header' ? 'h:' + item.group.name : 'alta')}
				{#if item.type === 'header'}
					<div
						class="px-4 py-2 font-bold text-[13px] text-bazar-dark bg-bazar-offwhite sticky top-0"
					>
						{item.group.name}
					</div>
				{:else if item.type === 'faculty'}
					<button
						type="button"
						class="w-full text-left px-6 py-2 text-[14px] text-bazar-gray-700 hover:bg-bazar-gray-100"
						onclick={() => selectFaculty(item.group, item.faculty)}
					>
						{item.faculty}
					</button>
				{:else}
					<button
						type="button"
						class="w-full text-left px-4 py-2 text-[14px] font-semibold text-bazar-dark border-t border-bazar-gray-100 hover:bg-bazar-gray-100"
						onclick={selectAlta}
					>
						{altaOptionLabel}
					</button>
				{/if}
			{/each}
		</div>
	{/if}

	{#if university === '__alta__'}
		<input
			id="alta-input"
			type="text"
			bind:value={altaText}
			class="mt-2 w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors"
			placeholder={altaPlaceholder}
			maxlength="200"
		/>
	{/if}

	<input
		type="hidden"
		name="university"
		value={university === '__alta__' ? altaText || 'Alta' : university}
	/>
	<input
		type="hidden"
		name="faculty"
		value={university === '__alta__' ? '' : faculty}
	/>
</div>
