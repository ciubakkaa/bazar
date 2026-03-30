<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import QuestionCard from '$lib/components/QuestionCard.svelte';

	let { data } = $props();

	// Top-level section: anunturi | intrebari | faq
	const activeSection = $derived(page.url.searchParams.get('section') ?? 'anunturi');
	// Sub-filter for intrebari tab
	const questionFilter = $derived(page.url.searchParams.get('filter') ?? 'all');
	const isVerified = $derived(!!data.profile?.is_verified);

	let expandedFaq = $state<number | null>(null);

	function relativeTime(dateStr: string | null): string {
		if (!dateStr) return '';
		const now = Date.now();
		const then = new Date(dateStr).getTime();
		const diffMs = now - then;
		const diffH = Math.floor(diffMs / (1000 * 60 * 60));
		const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		if (diffH < 1) return 'acum';
		if (diffH < 24) return `acum ${diffH}h`;
		if (diffD < 7) return `acum ${diffD}z`;
		return new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
	}

	const roleLabels: Record<string, string> = {
		admin: 'Admin',
		asmi: 'ASMI',
		class_lead: 'Sef de serie',
		student: 'Student',
	};

	const faqs = [
		{
			question: 'Unde e cantina si cat costa?',
			answer: 'Cantina e de obicei in campusul universitatii. Preturile variaza intre 15-30 RON pentru un meniu complet. Unele facultati au si un bufet cu preturi mai mici. Verifica cu colegii din anii superiori pentru locatia exacta.',
		},
		{
			question: 'Cum functioneaza bursa?',
			answer: 'Bursele se acorda pe baza mediei din semestrul anterior. Exista burse de merit (medie mare), burse sociale (pentru studenti cu venituri mici) si burse de performanta. Cererile se depun la secretariat la inceputul fiecarui semestru.',
		},
		{
			question: 'Cand incepe sesiunea?',
			answer: 'Sesiunea de examene incepe de obicei in ianuarie (semestrul 1) si iunie (semestrul 2). Datele exacte sunt afisate pe site-ul facultatii. Sesiunea dureaza aproximativ 3-4 saptamani, urmata de o saptamana de restante.',
		},
		{
			question: 'Cum imi fac legitimatia de student?',
			answer: 'Legitimatia se ridica de la secretariatul facultatii dupa ce esti inmatriculat. Ai nevoie de o fotografie tip buletin. Legitimatia trebuie vizata la inceputul fiecarui semestru pentru a fi valabila.',
		},
		{
			question: 'Pot sa imi schimb grupa sau seria?',
			answer: 'Da, in general se poate in primele 2 saptamani ale semestrului. Trebuie sa depui o cerere la secretariat. Aprobarea depinde de disponibilitate si de motivul cererii. Vorbeste cu secretariatul cat mai devreme.',
		},
		{
			question: 'Cum obtin abonamentul STB redus?',
			answer: 'Cu legitimatia de student vizata pe semestrul curent si buletinul, de la orice ghiseu STB sau online pe site-ul STB. Reducerea e de 50%. Poti lua abonament lunar sau pe 3 luni.',
		},
	];

	function setSection(section: string) {
		const params = new URLSearchParams();
		if (section !== 'anunturi') params.set('section', section);
		const qs = params.toString();
		goto(`/qa${qs ? `?${qs}` : ''}`, { replaceState: true });
	}

	function setQuestionFilter(filter: string) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('section', 'intrebari');
		if (filter === 'all') {
			params.delete('filter');
		} else {
			params.set('filter', filter);
		}
		const qs = params.toString();
		goto(`/qa${qs ? `?${qs}` : ''}`, { replaceState: true });
	}

	const filteredQuestions = $derived.by(() => {
		const questions = data.questions ?? [];
		if (questionFilter === 'faculty') {
			return questions.filter((q: any) => q.faculty_id === data.userFacultyId);
		}
		if (questionFilter === 'general') {
			return questions.filter((q: any) => !q.faculty_id);
		}
		return questions;
	});
</script>

<div class="px-5 py-6 max-w-3xl mx-auto">
	<!-- Header -->
	<h1 class="text-2xl md:text-[28px] font-heading font-bold text-bazar-dark mb-1">
		Comunitate
	</h1>
	<p class="text-sm text-bazar-gray-500 mb-5">Anunturi, intrebari si tot ce trebuie sa stii.</p>

	<!-- Top-level tabs -->
	<div class="flex gap-1 mb-6 bg-bazar-gray-100 rounded-full p-1">
		<button
			onclick={() => setSection('anunturi')}
			class="flex-1 py-2 text-sm font-semibold rounded-full transition-colors
				{activeSection === 'anunturi'
					? 'bg-bazar-yellow text-bazar-dark'
					: 'text-bazar-gray-500 hover:text-bazar-dark'}"
		>
			Anunturi
		</button>
		<button
			onclick={() => setSection('intrebari')}
			class="flex-1 py-2 text-sm font-semibold rounded-full transition-colors
				{activeSection === 'intrebari'
					? 'bg-bazar-yellow text-bazar-dark'
					: 'text-bazar-gray-500 hover:text-bazar-dark'}"
		>
			Intrebari
		</button>
		<button
			onclick={() => setSection('faq')}
			class="flex-1 py-2 text-sm font-semibold rounded-full transition-colors
				{activeSection === 'faq'
					? 'bg-bazar-yellow text-bazar-dark'
					: 'text-bazar-gray-500 hover:text-bazar-dark'}"
		>
			FAQ
		</button>
	</div>

	<!-- ANUNTURI TAB -->
	{#if activeSection === 'anunturi'}
		{#if data.announcements.length === 0}
			<div class="text-center py-12 text-bazar-gray-500">
				<p class="text-lg mb-1">Niciun anunt inca</p>
				<p class="text-sm">Anunturile vor fi postate de sefii de serie, ASMI si reprezentantii facultatii.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each data.announcements as announcement (announcement.id)}
					<div class="bg-white rounded-bazar-xl p-5 {announcement.is_pinned ? 'ring-2 ring-bazar-yellow' : ''}">
						<div class="flex items-center gap-2 mb-3">
							<div class="w-8 h-8 rounded-full bg-bazar-purple/10 flex items-center justify-center text-sm">📢</div>
							<div>
								<span class="text-sm font-semibold text-bazar-dark">{announcement.author?.full_name ?? 'Anonim'}</span>
								{#if announcement.author?.role && announcement.author.role !== 'student'}
									<span class="text-xs font-medium px-1.5 py-0.5 rounded-full bg-bazar-purple/10 text-bazar-purple ml-1">
										{roleLabels[announcement.author.role] ?? announcement.author.role}
									</span>
								{/if}
								<span class="text-xs text-bazar-gray-500 ml-2">{relativeTime(announcement.created_at)}</span>
							</div>
						</div>
						<h3 class="font-semibold text-bazar-dark mb-1">
							{#if announcement.is_pinned}<span class="mr-1">📌</span>{/if}{announcement.title}
						</h3>
						<p class="text-sm text-bazar-gray-500 leading-relaxed">{announcement.body}</p>
						{#if announcement.category}
							<div class="flex items-center gap-2 mt-3">
								<span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-bazar-gray-100 text-bazar-gray-700">{announcement.category}</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

	<!-- INTREBARI TAB -->
	{:else if activeSection === 'intrebari'}
		<!-- Verification banner -->
		{#if !isVerified}
			<a
				href="/profile"
				class="block mb-4 px-4 py-3 bg-amber-50 rounded-bazar-sm text-sm text-amber-800"
			>
				Verifica-te pentru a pune intrebari &rarr;
			</a>
		{/if}

		<!-- Sub-filters -->
		<div class="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
			{#each [
				{ key: 'all', label: 'Toate' },
				{ key: 'faculty', label: 'Facultatea mea' },
				{ key: 'general', label: 'Generale' },
			] as filter}
				<button
					onclick={() => setQuestionFilter(filter.key)}
					class="shrink-0 text-sm font-semibold px-4 py-2 rounded-full transition-colors
						{questionFilter === filter.key
							? 'bg-bazar-yellow text-bazar-dark'
							: 'bg-white text-bazar-gray-500 hover:text-bazar-dark'}"
				>
					{filter.label}
				</button>
			{/each}
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

	<!-- FAQ TAB -->
	{:else if activeSection === 'faq'}
		<div class="space-y-2">
			{#each faqs as faq, i}
				<button
					onclick={() => (expandedFaq = expandedFaq === i ? null : i)}
					class="w-full bg-white rounded-bazar-lg p-4 text-left transition-all hover:bg-bazar-gray-100"
				>
					<div class="flex items-center justify-between gap-3">
						<h4 class="font-semibold text-sm text-bazar-dark">{faq.question}</h4>
						<svg
							class="w-4 h-4 shrink-0 text-bazar-gray-500 transition-transform {expandedFaq === i ? 'rotate-180' : ''}"
							fill="none" viewBox="0 0 20 20"
						>
							<path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 7.5L10 12.5L15 7.5" />
						</svg>
					</div>
					{#if expandedFaq === i}
						<p class="text-sm text-bazar-gray-500 mt-3 leading-relaxed">{faq.answer}</p>
					{/if}
				</button>
			{/each}
		</div>

		<p class="text-center text-xs text-bazar-gray-500 mt-6">
			Nu gasesti ce cauti? <a href="/qa?section=intrebari" class="text-bazar-dark font-semibold hover:underline">Pune o intrebare</a>
		</p>
	{/if}
</div>

<!-- Floating ask button — only on intrebari tab -->
{#if activeSection === 'intrebari' && isVerified}
	<a
		href="/qa/ask"
		class="fixed bottom-24 right-5 md:bottom-8 md:right-8 bg-gradient-to-br from-bazar-yellow to-bazar-yellow-dim text-bazar-dark rounded-full shadow-[0_8px_40px_rgba(44,47,48,0.1)] hover:-translate-y-0.5 transition-all flex items-center gap-2 z-30"
	>
		<span class="flex items-center justify-center w-14 h-14 md:hidden text-2xl font-bold">+</span>
		<span class="hidden md:flex items-center gap-2 px-6 py-3.5 text-sm font-medium">
			<span class="text-lg leading-none">+</span>
			Intreaba
		</span>
	</a>
{/if}
