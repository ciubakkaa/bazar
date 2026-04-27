<script lang="ts">
	const items = [
		{
			q: 'Cat dureaza sa primesti loc in camin?',
			a: 'In medie 2-3 saptamani dupa ce depui cererea. La UPB e mai rapid.',
			author: 'Maria, anul 3',
			verified: true
		},
		{
			q: 'Ce acte iti trebuie pentru bursa sociala?',
			a: 'Adeverinta de venit, copie CI, dosar... lasa-ma sa-ti scriu lista completa.',
			author: 'Andrei, ASMI',
			verified: true
		},
		{
			q: 'E ok daca nu stiu inca ce specializare aleg?',
			a: '',
			author: '',
			verified: false
		}
	];
</script>

<div
	class="bg-white rounded-bazar-xl p-5 md:p-6 shadow-[0_8px_40px_rgba(44,47,48,0.04)] pointer-events-none select-none"
>
	<div class="flex items-center justify-between mb-4">
		<div>
			<div class="font-heading font-bold text-lg">Intrebari & Raspunsuri</div>
			<div class="text-[12px] text-bazar-gray-500">Studentii din anii mari raspund</div>
		</div>
		<div class="text-2xl">❓</div>
	</div>

	{#each items as item}
		<div class="border-b border-bazar-gray-100 last:border-0 py-3">
			<div class="font-semibold text-[14px] mb-1">{item.q}</div>
			{#if item.a}
				<div
					class="bg-bazar-offwhite rounded-bazar-sm p-3 mt-2 {item.verified
						? 'border-l-4 border-bazar-yellow'
						: ''}"
				>
					<div class="text-[13px] text-bazar-gray-700 mb-2">{item.a}</div>
					<div class="flex items-center gap-2 text-[11px] text-bazar-gray-500">
						<span class="font-semibold">{item.author}</span>
						{#if item.verified}
							<span class="px-1.5 py-0.5 bg-bazar-yellow rounded-full text-bazar-dark font-bold">
								verificat
							</span>
						{/if}
					</div>
				</div>
			{:else}
				<div class="text-[12px] text-bazar-gray-500 italic mt-1">Astepta raspuns...</div>
			{/if}
		</div>
	{/each}
</div>
