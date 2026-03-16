<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { BUCHAREST_SECTORS } from '$lib/constants';

	let { open, onClose }: { open: boolean; onClose: () => void } = $props();

	// Read initial values from URL
	let budgetMin = $state(page.url.searchParams.get('budget_min') ?? '');
	let budgetMax = $state(page.url.searchParams.get('budget_max') ?? '');
	let selectedSectors: string[] = $state(
		page.url.searchParams.get('sectors')?.split(',').filter(Boolean) ?? []
	);
	let moveInMonth = $state(page.url.searchParams.get('move_in') ?? '');
	let gender = $state(page.url.searchParams.get('gender') ?? '');
	let hasApartment = $state(page.url.searchParams.get('has_apartment') === 'true');

	function toggleSector(sector: string) {
		if (selectedSectors.includes(sector)) {
			selectedSectors = selectedSectors.filter((s) => s !== sector);
		} else {
			selectedSectors = [...selectedSectors, sector];
		}
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (budgetMin) params.set('budget_min', budgetMin);
		if (budgetMax) params.set('budget_max', budgetMax);
		if (selectedSectors.length) params.set('sectors', selectedSectors.join(','));
		if (moveInMonth) params.set('move_in', moveInMonth);
		if (gender) params.set('gender', gender);
		if (hasApartment) params.set('has_apartment', 'true');

		// Preserve the tab param if it exists
		const currentTab = page.url.searchParams.get('tab');
		if (currentTab) params.set('tab', currentTab);

		const qs = params.toString();
		goto(`/people${qs ? `?${qs}` : ''}`, { replaceState: true });
		onClose();
	}

	function resetFilters() {
		budgetMin = '';
		budgetMax = '';
		selectedSectors = [];
		moveInMonth = '';
		gender = '';
		hasApartment = false;

		const currentTab = page.url.searchParams.get('tab');
		const params = new URLSearchParams();
		if (currentTab) params.set('tab', currentTab);
		const qs = params.toString();
		goto(`/people${qs ? `?${qs}` : ''}`, { replaceState: true });
		onClose();
	}

	const months = [
		{ value: '', label: 'Oricând' },
		{ value: 'septembrie', label: 'Septembrie' },
		{ value: 'octombrie', label: 'Octombrie' },
		{ value: 'noiembrie', label: 'Noiembrie' },
		{ value: 'decembrie', label: 'Decembrie' },
		{ value: 'ianuarie', label: 'Ianuarie' },
		{ value: 'februarie', label: 'Februarie' },
	];
</script>

{#if open}
	<!-- Overlay -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/40 z-50 transition-opacity"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
	></div>

	<!-- Panel -->
	<div class="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 rounded-l-bazar-lg shadow-xl overflow-y-auto">
		<div class="p-6">
			<!-- Header -->
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-heading font-bold text-bazar-dark">Filtre</h2>
				<button onclick={onClose} class="text-bazar-gray-500 hover:text-bazar-dark text-xl leading-none">
					&times;
				</button>
			</div>

			<!-- Budget -->
			<div class="mb-6">
				<label class="block text-sm font-semibold text-bazar-dark mb-2">Buget (EUR/lună)</label>
				<div class="flex items-center gap-2">
					<input
						type="number"
						bind:value={budgetMin}
						placeholder="Min"
						class="w-full px-3 py-2 border border-bazar-gray-200 rounded-bazar-sm text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 focus:border-bazar-yellow"
					/>
					<span class="text-bazar-gray-400">–</span>
					<input
						type="number"
						bind:value={budgetMax}
						placeholder="Max"
						class="w-full px-3 py-2 border border-bazar-gray-200 rounded-bazar-sm text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 focus:border-bazar-yellow"
					/>
				</div>
			</div>

			<!-- Sectors -->
			<div class="mb-6">
				<label class="block text-sm font-semibold text-bazar-dark mb-2">Zone</label>
				<div class="flex flex-wrap gap-2">
					{#each BUCHAREST_SECTORS as sector}
						<button
							onclick={() => toggleSector(sector)}
							class="px-3 py-1.5 text-xs font-medium rounded-bazar-pill border transition-colors
								{selectedSectors.includes(sector)
									? 'bg-bazar-dark text-white border-bazar-dark'
									: 'bg-white text-bazar-gray-500 border-bazar-gray-200 hover:border-bazar-gray-300'}"
						>
							{sector}
						</button>
					{/each}
				</div>
			</div>

			<!-- Move-in month -->
			<div class="mb-6">
				<label class="block text-sm font-semibold text-bazar-dark mb-2">Luna mutării</label>
				<select
					bind:value={moveInMonth}
					class="w-full px-3 py-2 border border-bazar-gray-200 rounded-bazar-sm text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 focus:border-bazar-yellow bg-white"
				>
					{#each months as month}
						<option value={month.value}>{month.label}</option>
					{/each}
				</select>
			</div>

			<!-- Gender -->
			<div class="mb-6">
				<label class="block text-sm font-semibold text-bazar-dark mb-2">Gen preferat</label>
				<div class="flex flex-col gap-2">
					{#each [{ value: '', label: 'Oricine' }, { value: 'masculin', label: 'Masculin' }, { value: 'feminin', label: 'Feminin' }] as option}
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="gender"
								value={option.value}
								checked={gender === option.value}
								onchange={() => (gender = option.value)}
								class="accent-bazar-dark"
							/>
							<span class="text-sm text-bazar-dark">{option.label}</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Has apartment -->
			<div class="mb-8">
				<label class="flex items-center justify-between cursor-pointer">
					<span class="text-sm font-semibold text-bazar-dark">Are apartament</span>
					<button
						onclick={() => (hasApartment = !hasApartment)}
						class="relative w-11 h-6 rounded-full transition-colors {hasApartment ? 'bg-bazar-dark' : 'bg-bazar-gray-200'}"
						role="switch"
						aria-checked={hasApartment}
					>
						<span
							class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
								{hasApartment ? 'translate-x-5' : 'translate-x-0'}"
						></span>
					</button>
				</label>
			</div>

			<!-- Actions -->
			<div class="flex gap-3">
				<button
					onclick={resetFilters}
					class="flex-1 px-4 py-2.5 text-sm font-medium text-bazar-dark border-2 border-bazar-gray-200 rounded-bazar-sm hover:border-bazar-gray-300 transition-colors"
				>
					Resetează
				</button>
				<button
					onclick={applyFilters}
					class="flex-1 px-4 py-2.5 text-sm font-medium bg-bazar-dark text-white rounded-bazar-sm hover:opacity-90 transition-opacity"
				>
					Aplică
				</button>
			</div>
		</div>
	</div>
{/if}
