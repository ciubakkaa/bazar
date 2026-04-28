<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import WaitlistForm from '$lib/components/landing/WaitlistForm.svelte';
	import PreviewChecklist from '$lib/components/landing/PreviewChecklist.svelte';
	import PreviewQA from '$lib/components/landing/PreviewQA.svelte';
	import LocaleToggle from '$lib/components/landing/LocaleToggle.svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>{m.head_title()}</title>
	<meta name="description" content={m.head_description()} />
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
			{m.nav_features()}
		</a>
		<a
			href="#preview"
			class="hidden md:inline-block text-bazar-gray-700 text-[15px] font-medium px-4 py-2 rounded-bazar-sm hover:bg-bazar-gray-100 transition-colors no-underline"
		>
			{m.nav_preview()}
		</a>
		<a
			href="#waitlist"
			class="bg-bazar-yellow text-bazar-dark font-semibold text-[15px] px-5 md:px-6 py-2.5 rounded-full hover:-translate-y-0.5 transition-transform no-underline"
		>
			{m.nav_subscribe()}
		</a>
		<LocaleToggle />
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
			{m.hero_tag()}
		</div>
		<h1
			class="font-heading font-bold text-4xl md:text-[56px] leading-[1.1] tracking-tight mb-5"
		>
			{m.hero_title_part1()}
			<br />
			{m.hero_title_e()}
			<span class="inline-block bg-bazar-yellow px-2 py-0.5 rounded-md -rotate-1">
				{m.hero_title_haos()}
			</span>
			<br />
			<span class="text-bazar-gray-500">{m.hero_title_punemordine()}</span>
		</h1>
		<p class="text-lg text-bazar-gray-700 leading-relaxed mb-8 max-w-[460px]">
			{m.hero_subtitle()}
		</p>
		<div class="flex gap-3 flex-wrap">
			<a
				href="#waitlist"
				class="inline-flex items-center gap-2 bg-gradient-to-br from-bazar-yellow to-bazar-yellow-dim text-bazar-dark px-8 py-3.5 rounded-full font-bold text-base no-underline hover:-translate-y-0.5 hover:shadow-lg transition-all"
			>
				{m.hero_cta_primary()} →
			</a>
			<a
				href="#preview"
				class="inline-flex items-center gap-2 bg-bazar-gray-100 text-bazar-gray-700 px-6 py-3.5 rounded-full font-medium text-base no-underline hover:bg-bazar-gray-200 hover:text-bazar-dark transition-all"
			>
				{m.hero_cta_secondary()}
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
				<div class="font-heading font-bold text-xl mb-1">{m.hero_mock_title()}</div>
				<div class="text-[13px] text-bazar-gray-500 mb-4">{m.hero_mock_progress()}</div>
				<div class="bg-bazar-gray-100 rounded-full h-2 mb-5 overflow-hidden">
					<div class="bg-bazar-green h-full w-[0%] rounded-full"></div>
				</div>
				{#each [
					{ label: m.hero_mock_item1(), tag: m.tag_acte(), tagClass: 'bg-blue-100 text-blue-800' },
					{ label: m.hero_mock_item2(), tag: m.tag_cazare(), tagClass: 'bg-green-100 text-green-800' },
					{ label: m.hero_mock_item3(), tag: m.tag_acte(), tagClass: 'bg-blue-100 text-blue-800' },
					{ label: m.hero_mock_item4(), tag: m.tag_acte(), tagClass: 'bg-blue-100 text-blue-800' },
					{ label: m.hero_mock_item5(), tag: m.tag_campus(), tagClass: 'bg-amber-100 text-amber-800' }
				] as item}
					<div class="flex items-start gap-2.5 p-3 bg-white rounded-bazar-sm mb-2">
						<div class="w-5 h-5 rounded-md border-2 border-bazar-gray-300 shrink-0 mt-0.5"></div>
						<div>
							<div class="text-[13px] font-semibold leading-tight">{item.label}</div>
							<span
								class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 {item.tagClass}"
								>{item.tag}</span
							>
						</div>
					</div>
				{/each}
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
			<h3 class="font-heading font-bold text-xl mb-2">{m.features_checklist_title()}</h3>
			<p class="text-sm text-bazar-gray-500 leading-relaxed mb-4">
				{m.features_checklist_desc()}
			</p>
			<div class="flex gap-2 flex-wrap">
				<span class="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700">
					{m.tag_acte()}
				</span>
				<span class="text-xs font-semibold px-3 py-1 rounded-full bg-green-50 text-green-700">
					{m.tag_cazare()}
				</span>
				<span class="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700">
					{m.tag_inregistrare()}
				</span>
				<span class="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700">
					{m.tag_campus()}
				</span>
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
				<h3 class="font-heading font-bold text-xl text-white mb-2">
					{m.features_community_title()}
				</h3>
				<p class="text-sm text-white/60 leading-relaxed">{m.features_community_desc()}</p>
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
				{m.features_qa_title()}
			</h3>
			<p class="text-sm text-bazar-dark/70 leading-relaxed">{m.features_qa_desc()}</p>
		</div>
		<div class="flex items-center justify-center md:justify-end">
			<div class="bg-white rounded-bazar-sm px-4 py-3 shadow-sm rotate-1 max-w-[260px]">
				<div class="text-[13px] font-semibold mb-1">{m.features_qa_quote()}</div>
				<div class="text-[11px] text-bazar-gray-500 italic">{m.features_qa_author()}</div>
			</div>
		</div>
	</div>
</section>

<!-- Preview section -->
<section id="preview" class="max-w-[1200px] mx-auto px-5 md:px-8 mt-16 md:mt-20">
	<div class="text-center mb-8">
		<h2 class="font-heading font-bold text-2xl md:text-3xl mb-2">{m.preview_heading()}</h2>
		<p class="text-bazar-gray-700">{m.preview_subtitle()}</p>
	</div>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 max-w-[900px] mx-auto">
		<PreviewChecklist />
		<PreviewQA />
	</div>
</section>

<!-- Social proof -->
<section class="max-w-[1200px] mx-auto px-5 md:px-8 mt-16 text-center">
	<p class="text-sm text-bazar-gray-500 font-medium mb-5">{m.social_proof_heading()}</p>
	<div class="flex justify-center gap-4 md:gap-8 flex-wrap">
		<div
			class="flex items-center gap-2 px-5 py-3 bg-white rounded-full font-semibold text-[15px] text-bazar-gray-700"
		>
			<span class="w-2.5 h-2.5 rounded-full bg-bazar-green"></span> {m.social_proof_upb()}
		</div>
		<div
			class="flex items-center gap-2 px-5 py-3 bg-white rounded-full font-semibold text-[15px] text-bazar-gray-700"
		>
			<span class="w-2.5 h-2.5 rounded-full bg-bazar-green"></span> {m.social_proof_ase()}
		</div>
		<div
			class="flex items-center gap-2 px-5 py-3 bg-white rounded-full font-semibold text-[15px] text-bazar-gray-700"
		>
			<span class="w-2.5 h-2.5 rounded-full bg-bazar-green"></span> {m.social_proof_ub()}
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
		{m.bottom_cta_title()}
	</h2>
	<p class="text-white/60 text-base mb-7 relative z-10">{m.bottom_cta_subtitle()}</p>
	<a
		href="#waitlist"
		class="relative z-10 inline-flex items-center gap-2 bg-gradient-to-br from-bazar-yellow to-bazar-yellow-dim text-bazar-dark px-8 py-3.5 rounded-full font-bold text-base no-underline hover:-translate-y-0.5 transition-transform"
	>
		{m.bottom_cta_button()} →
	</a>
</section>

<footer class="text-center px-5 md:px-8 pb-10 pt-6 text-[13px] text-bazar-gray-500">
	{m.footer_text()}
</footer>
