<script lang="ts">
	const items = [
		{ label: 'Confirma locul la facultate', tag: 'Acte', tagClass: 'bg-blue-100 text-blue-800', done: true },
		{ label: 'Depune cererea pentru camin', tag: 'Cazare', tagClass: 'bg-green-100 text-green-800', done: true },
		{ label: 'Plateste taxa de inmatriculare', tag: 'Acte', tagClass: 'bg-blue-100 text-blue-800', done: true },
		{ label: 'Fa-ti adeverinta medicala', tag: 'Acte', tagClass: 'bg-blue-100 text-blue-800', done: false },
		{ label: 'Cauta un coleg de apartament', tag: 'Cazare', tagClass: 'bg-green-100 text-green-800', done: false },
		{ label: 'Inscrie-te in grupul facultatii', tag: 'Comunitate', tagClass: 'bg-purple-100 text-purple-800', done: false }
	];
</script>

<div
	class="bg-white rounded-bazar-xl p-5 md:p-6 shadow-[0_8px_40px_rgba(44,47,48,0.04)] pointer-events-none select-none"
>
	<div class="flex items-center justify-between mb-4">
		<div>
			<div class="font-heading font-bold text-lg">Checklist-ul tau</div>
			<div class="text-[12px] text-bazar-gray-500">3 din 10 completate</div>
		</div>
		<div class="text-2xl">📋</div>
	</div>
	<div class="bg-bazar-gray-100 rounded-full h-2 mb-5 overflow-hidden">
		<div class="bg-bazar-green h-full w-[30%] rounded-full"></div>
	</div>

	{#each items as item}
		<div class="flex items-start gap-2.5 p-3 bg-bazar-offwhite rounded-bazar-sm mb-2">
			<div
				class="w-5 h-5 rounded-md shrink-0 mt-0.5 flex items-center justify-center {item.done
					? 'bg-bazar-green'
					: 'border-2 border-bazar-gray-300'}"
			>
				{#if item.done}<span class="text-white text-[11px] font-bold">✓</span>{/if}
			</div>
			<div>
				<div
					class="text-[13px] font-semibold leading-tight {item.done
						? 'line-through text-bazar-gray-500'
						: ''}"
				>
					{item.label}
				</div>
				<span
					class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 {item.tagClass}"
				>
					{item.tag}
				</span>
			</div>
		</div>
	{/each}
</div>
