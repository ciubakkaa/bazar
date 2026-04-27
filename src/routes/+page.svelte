<script lang="ts">
	import WaitlistForm from '$lib/components/landing/WaitlistForm.svelte';
	import PreviewChecklist from '$lib/components/landing/PreviewChecklist.svelte';
	import PreviewQA from '$lib/components/landing/PreviewQA.svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>Bazar — facultatea, fara haos</title>
	<meta
		name="description"
		content="Checklist, comunitate, raspunsuri. Aplicatia care iti pune ordine in inceputul facultatii. Aboneaza-te sa fii anuntat la lansare."
	/>
</svelte:head>

<nav class="flex justify-between items-center px-5 py-4 md:px-8 max-w-[1200px] mx-auto">
	<a
		href="/"
		class="font-heading font-bold text-[28px] tracking-tight text-bazar-dark no-underline"
	>
		ba<span class="inline-block bg-bazar-yellow px-2 py-0.5 rounded-md -rotate-2 ml-0.5">zar</span>
	</a>
	<div class="flex gap-2 md:gap-3 items-center">
		<a
			href="#features"
			class="hidden md:inline-block text-bazar-gray-700 text-[15px] font-medium px-4 py-2 rounded-bazar-sm hover:bg-bazar-gray-100 transition-colors no-underline"
		>
			Cum functioneaza
		</a>
		<a
			href="#preview"
			class="hidden md:inline-block text-bazar-gray-700 text-[15px] font-medium px-4 py-2 rounded-bazar-sm hover:bg-bazar-gray-100 transition-colors no-underline"
		>
			Vezi cum arata
		</a>
		<a
			href="#waitlist"
			class="bg-bazar-yellow text-bazar-dark font-semibold text-[15px] px-5 md:px-6 py-2.5 rounded-full hover:-translate-y-0.5 transition-transform no-underline"
		>
			Aboneaza-te
		</a>
	</div>
</nav>

<!-- Hero -->
<section
	class="max-w-[1200px] mx-auto px-5 md:px-8 pt-8 md:pt-16 pb-10 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center"
>
	<div>
		<div
			class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bazar-yellow/40 text-bazar-dark text-[13px] font-semibold mb-4"
		>
			<span class="w-2 h-2 rounded-full bg-bazar-dark animate-pulse"></span>
			Lansare in vara 2026
		</div>
		<h1
			class="font-heading font-bold text-4xl md:text-[56px] leading-[1.1] tracking-tight mb-5"
		>
			Inceputul facultatii
			<br />
			e <span class="inline-block bg-bazar-yellow px-2 py-0.5 rounded-md -rotate-1">haos.</span>
			<br />
			<span class="text-bazar-gray-500">Noi punem ordine.</span>
		</h1>
		<p class="text-lg text-bazar-gray-700 leading-relaxed mb-8 max-w-[460px]">
			Checklist-uri, raspunsuri la intrebari stupide, comunitate — totul intr-un singur loc. Facut
			de studenti, pentru studenti.
		</p>
		<div class="flex gap-3 flex-wrap">
			<a
				href="#waitlist"
				class="inline-flex items-center gap-2 bg-gradient-to-br from-bazar-yellow to-bazar-yellow-dim text-bazar-dark px-8 py-3.5 rounded-full font-bold text-base no-underline hover:-translate-y-0.5 hover:shadow-lg transition-all"
			>
				Anunta-ma cand iese →
			</a>
			<a
				href="#preview"
				class="inline-flex items-center gap-2 bg-bazar-gray-100 text-bazar-gray-700 px-6 py-3.5 rounded-full font-medium text-base no-underline hover:bg-bazar-gray-200 hover:text-bazar-dark transition-all"
			>
				Vezi cum arata
			</a>
		</div>
	</div>

	<div class="relative order-first md:order-last overflow-hidden md:overflow-visible">
		<span
			class="absolute -top-2.5 left-0 md:-left-5 text-[28px] md:text-[32px] -rotate-[15deg] drop-shadow-md z-10"
			>📋</span
		>
		<span
			class="absolute top-10 right-0 md:-right-7 text-[28px] md:text-[32px] rotate-[10deg] drop-shadow-md z-10"
			>💬</span
		>
		<span
			class="absolute bottom-10 left-0 md:-left-7 text-[28px] md:text-[32px] rotate-[8deg] drop-shadow-md z-10"
			>❓</span
		>

		<div
			class="bg-white rounded-[32px] p-4 shadow-[0_8px_60px_rgba(44,47,48,0.06)] max-w-[280px] md:max-w-[340px] mx-auto rotate-2 md:rotate-2"
		>
			<div class="bg-bazar-offwhite rounded-[20px] p-4 md:p-5 min-h-[380px] md:min-h-[460px]">
				<div class="font-heading font-bold text-xl mb-1">Checklist-ul tau</div>
				<div class="text-[13px] text-bazar-gray-500 mb-4">0 din 10 completate</div>
				<div class="bg-bazar-gray-100 rounded-full h-2 mb-5 overflow-hidden">
					<div class="bg-bazar-green h-full w-[0%] rounded-full"></div>
				</div>
				<div class="flex items-start gap-2.5 p-3 bg-white rounded-bazar-sm mb-2">
					<div class="w-5 h-5 rounded-md border-2 border-bazar-gray-300 shrink-0 mt-0.5"></div>
					<div>
						<div class="text-[13px] font-semibold leading-tight">
							Confirma locul la facultate
						</div>
						<span
							class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 bg-blue-100 text-blue-800"
							>Acte</span
						>
					</div>
				</div>
				<div class="flex items-start gap-2.5 p-3 bg-white rounded-bazar-sm mb-2">
					<div class="w-5 h-5 rounded-md border-2 border-bazar-gray-300 shrink-0 mt-0.5"></div>
					<div>
						<div class="text-[13px] font-semibold leading-tight">Depune cererea pentru camin</div>
						<span
							class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 bg-green-100 text-green-800"
							>Cazare</span
						>
					</div>
				</div>
				<div class="flex items-start gap-2.5 p-3 bg-white rounded-bazar-sm mb-2">
					<div class="w-5 h-5 rounded-md border-2 border-bazar-gray-300 shrink-0 mt-0.5"></div>
					<div>
						<div class="text-[13px] font-semibold leading-tight">
							Plateste taxa de inmatriculare
						</div>
						<span
							class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 bg-blue-100 text-blue-800"
							>Acte</span
						>
					</div>
				</div>
				<div class="flex items-start gap-2.5 p-3 bg-white rounded-bazar-sm mb-2">
					<div class="w-5 h-5 rounded-md border-2 border-bazar-gray-300 shrink-0 mt-0.5"></div>
					<div>
						<div class="text-[13px] font-semibold leading-tight">Fa-ti adeverinta medicala</div>
						<span
							class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 bg-blue-100 text-blue-800"
							>Acte</span
						>
					</div>
				</div>
				<div class="flex items-start gap-2.5 p-3 bg-white rounded-bazar-sm mb-2">
					<div class="w-5 h-5 rounded-md border-2 border-bazar-gray-300 shrink-0 mt-0.5"></div>
					<div>
						<div class="text-[13px] font-semibold leading-tight">Exploreaza campusul</div>
						<span
							class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 bg-amber-100 text-amber-800"
							>Campus</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Features bento (no roommates) -->
<section
	id="features"
	class="max-w-[1200px] mx-auto px-5 md:px-8 mt-10 flex flex-col gap-4"
>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div
			class="md:col-span-2 bg-white rounded-bazar-xl p-7 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(44,47,48,0.06)] transition-all"
		>
			<div
				class="w-12 h-12 rounded-bazar-sm bg-amber-100 flex items-center justify-center text-2xl mb-4"
			>
				📋
			</div>
			<h3 class="font-heading font-bold text-xl mb-2">Checklist pas cu pas</h3>
			<p class="text-sm text-bazar-gray-500 leading-relaxed mb-4">
				Toate deadline-urile si actele de care ai nevoie, intr-o lista simpla. Bifezi, avansezi,
				nu ratezi nimic.
			</p>
			<div class="flex gap-2 flex-wrap">
				<span class="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700"
					>Acte</span
				>
				<span class="text-xs font-semibold px-3 py-1 rounded-full bg-green-50 text-green-700"
					>Cazare</span
				>
				<span class="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700"
					>Inregistrare</span
				>
				<span class="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700"
					>Campus</span
				>
			</div>
		</div>
		<div
			class="bg-bazar-dark rounded-bazar-xl p-7 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(44,47,48,0.06)] transition-all flex flex-col justify-between"
		>
			<div>
				<div
					class="w-12 h-12 rounded-bazar-sm bg-white/10 flex items-center justify-center text-2xl mb-4"
				>
					💬
				</div>
				<h3 class="font-heading font-bold text-xl text-white mb-2">Comunitate</h3>
				<p class="text-sm text-white/60 leading-relaxed">
					Grupuri pe facultate. Cunoaste-ti colegii inainte sa inceapa cursurile.
				</p>
			</div>
		</div>
	</div>

	<div
		class="bg-bazar-yellow rounded-bazar-xl p-7 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(44,47,48,0.06)] transition-all grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
	>
		<div>
			<div
				class="w-12 h-12 rounded-bazar-sm bg-bazar-dark/10 flex items-center justify-center text-2xl mb-4"
			>
				❓
			</div>
			<h3 class="font-heading font-bold text-xl text-bazar-dark mb-2">
				Intreaba orice. Fara intrebari stupide.
			</h3>
			<p class="text-sm text-bazar-dark/70 leading-relaxed">
				Pune intrebarea. Studentii din anii mari si reprezentantii de an raspund. Raspunsurile
				verificate apar evidentiate.
			</p>
		</div>
		<div class="flex items-center justify-center md:justify-end">
			<div
				class="bg-white rounded-bazar-sm px-4 py-3 shadow-sm rotate-1 max-w-[260px]"
			>
				<div class="text-[13px] font-semibold mb-1">"Cat dureaza sa primesti loc in camin?"</div>
				<div class="text-[11px] text-bazar-gray-500 italic">
					Maria, anul 3 · verificat ✓
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Preview section -->
<section id="preview" class="max-w-[1200px] mx-auto px-5 md:px-8 mt-16 md:mt-20">
	<div class="text-center mb-8">
		<h2 class="font-heading font-bold text-2xl md:text-3xl mb-2">
			Asa va arata cand lansam.
		</h2>
		<p class="text-bazar-gray-700">Un mic preview din interiorul aplicatiei.</p>
	</div>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 max-w-[900px] mx-auto">
		<PreviewChecklist />
		<PreviewQA />
	</div>
</section>

<!-- Social proof -->
<section class="max-w-[1200px] mx-auto px-5 md:px-8 mt-16 text-center">
	<p class="text-sm text-bazar-gray-500 font-medium mb-5">
		Construim primul pentru studentii de la:
	</p>
	<div class="flex justify-center gap-4 md:gap-8 flex-wrap">
		<div
			class="flex items-center gap-2 px-5 py-3 bg-white rounded-full font-semibold text-[15px] text-bazar-gray-700"
		>
			<span class="w-2.5 h-2.5 rounded-full bg-bazar-green"></span> UPB — Politehnica
		</div>
		<div
			class="flex items-center gap-2 px-5 py-3 bg-white rounded-full font-semibold text-[15px] text-bazar-gray-700"
		>
			<span class="w-2.5 h-2.5 rounded-full bg-bazar-green"></span> ASE
		</div>
		<div
			class="flex items-center gap-2 px-5 py-3 bg-white rounded-full font-semibold text-[15px] text-bazar-gray-700"
		>
			<span class="w-2.5 h-2.5 rounded-full bg-bazar-green"></span> Universitatea din Bucuresti
		</div>
	</div>
</section>

<!-- Waitlist form -->
<WaitlistForm {form} />

<!-- Bottom CTA -->
<section
	class="relative overflow-hidden bg-bazar-dark rounded-[20px] md:rounded-[28px] mx-4 md:mx-8 max-w-[1136px] lg:mx-auto mt-12 md:mt-20 mb-12 md:mb-16 px-5 md:px-8 py-10 md:py-12 text-center"
>
	<div
		class="absolute -top-1/2 -right-[20%] w-[300px] h-[300px] bg-bazar-purple opacity-15 rounded-full blur-[60px]"
	></div>
	<div
		class="absolute -bottom-[30%] -left-[10%] w-[250px] h-[250px] bg-bazar-yellow opacity-12 rounded-full blur-[60px]"
	></div>
	<h2 class="font-heading font-bold text-3xl md:text-4xl text-white mb-3 relative z-10">
		Gata cu panica de boboc.
	</h2>
	<p class="text-white/60 text-base mb-7 relative z-10">
		Lasa-ne emailul si te anuntam cand iese.
	</p>
	<a
		href="#waitlist"
		class="relative z-10 inline-flex items-center gap-2 bg-gradient-to-br from-bazar-yellow to-bazar-yellow-dim text-bazar-dark px-8 py-3.5 rounded-full font-bold text-base no-underline hover:-translate-y-0.5 transition-transform"
	>
		Aboneaza-te →
	</a>
</section>

<footer class="text-center px-5 md:px-8 pb-10 pt-6 text-[13px] text-bazar-gray-500">
	Bazar &copy; 2026 &middot; Facut cu nervi si cafea in Bucuresti
</footer>
