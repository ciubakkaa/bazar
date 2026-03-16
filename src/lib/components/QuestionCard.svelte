<script lang="ts">
	type QuestionData = {
		id: string;
		title: string;
		is_pinned: boolean | null;
		created_at: string | null;
		faculty_id: string | null;
		author: { full_name: string; year: number | null; faculty_id: string | null } | null;
		answers: { count: number }[];
	};

	let { question }: { question: QuestionData } = $props();

	const answerCount = $derived(question.answers?.[0]?.count ?? 0);

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

	const yearBadgeClass = $derived(
		(question.author?.year ?? 0) >= 3
			? 'bg-green-100 text-green-700'
			: 'bg-bazar-gray-100 text-bazar-gray-700'
	);
</script>

<a
	href="/qa/{question.id}"
	class="block bg-white rounded-bazar-md border-2 border-bazar-gray-100 hover:border-bazar-gray-300 hover:shadow-md transition-all p-4"
>
	<!-- Title -->
	<h3 class="font-semibold text-bazar-dark mb-2">
		{#if question.is_pinned}<span class="mr-1">📌</span>{/if}{question.title}
	</h3>

	<!-- Author + badges -->
	<div class="flex items-center gap-2 flex-wrap mb-2">
		{#if question.author}
			<span class="text-sm text-bazar-dark">{question.author.full_name}</span>
			{#if question.author.year}
				<span class="text-xs font-medium px-2 py-0.5 rounded-bazar-pill {yearBadgeClass}">
					Anul {question.author.year}
				</span>
			{/if}
		{/if}
		{#if question.faculty_id}
			<span class="text-xs font-medium px-2 py-0.5 rounded-bazar-pill bg-bazar-purple/10 text-bazar-purple">
				Facultate
			</span>
		{/if}
	</div>

	<!-- Meta row -->
	<div class="flex items-center gap-3">
		<span class="text-sm text-bazar-gray-500">{answerCount} {answerCount === 1 ? 'raspuns' : 'raspunsuri'}</span>
		<span class="text-xs text-bazar-gray-500">{relativeTime(question.created_at)}</span>
	</div>
</a>
