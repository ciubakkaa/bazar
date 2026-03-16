<script lang="ts">
	import { enhance } from '$app/forms';
	import { createClient } from '$lib/supabase';

	let { data, form } = $props();

	const supabase = createClient();
	const userId = $derived(data.user?.id);
	const isVerified = $derived(!!data.profile?.is_verified);

	let votedIds = $state(new Set<string>());
	let answerUpvotes = $state<Record<string, number>>({});

	$effect(() => {
		votedIds = new Set(data.votedAnswerIds ?? []);
	});

	$effect(() => {
		answerUpvotes = Object.fromEntries((data.answers ?? []).map((a: any) => [a.id, a.upvotes ?? 0]));
	});
	let submitting = $state(false);
	let answerText = $state('');

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

	function yearBadgeClass(year: number | null): string {
		return (year ?? 0) >= 3
			? 'bg-green-100 text-green-700'
			: 'bg-bazar-gray-100 text-bazar-gray-700';
	}

	async function toggleVote(answerId: string) {
		if (!userId || !isVerified) return;

		const hasVoted = votedIds.has(answerId);

		// Optimistic update
		if (hasVoted) {
			votedIds.delete(answerId);
			votedIds = new Set(votedIds);
			answerUpvotes[answerId] = (answerUpvotes[answerId] ?? 0) - 1;
		} else {
			votedIds.add(answerId);
			votedIds = new Set(votedIds);
			answerUpvotes[answerId] = (answerUpvotes[answerId] ?? 0) + 1;
		}

		// Persist
		if (hasVoted) {
			await supabase
				.from('answer_votes')
				.delete()
				.eq('answer_id', answerId)
				.eq('voter_id', userId);
		} else {
			await supabase
				.from('answer_votes')
				.insert({ answer_id: answerId, voter_id: userId });
		}
	}
</script>

{#if !data.question}
	<div class="px-5 py-12 text-center text-bazar-gray-500">
		<p class="text-lg">Intrebarea nu a fost gasita.</p>
		<a href="/qa" class="text-sm text-bazar-dark underline mt-2 inline-block">&larr; Inapoi</a>
	</div>
{:else}
	{@const q = data.question}
	<div class="px-5 py-6 max-w-2xl mx-auto">
		<!-- Back -->
		<a
			href="/qa"
			class="inline-flex items-center gap-1 text-sm text-bazar-gray-500 hover:text-bazar-dark mb-6 transition-colors"
		>
			&larr; Intrebari
		</a>

		<!-- Question -->
		<div class="bg-white rounded-bazar-md border-2 border-bazar-gray-100 p-4 md:p-5 mb-6">
			<h1 class="text-xl font-heading font-bold text-bazar-dark mb-3 break-words">
				{#if q.is_pinned}<span class="mr-1">📌</span>{/if}{q.title}
			</h1>

			{#if q.body}
				<p class="text-[15px] text-bazar-dark leading-relaxed mb-4 break-words">{q.body}</p>
			{/if}

			<!-- Author info -->
			<div class="flex items-center gap-2 flex-wrap">
				{#if q.author}
					<span class="text-sm text-bazar-dark font-medium">{q.author.full_name}</span>
					{#if q.author.year}
						<span class="text-xs font-medium px-2 py-0.5 rounded-bazar-pill {yearBadgeClass(q.author.year)}">
							Anul {q.author.year}
						</span>
					{/if}
					{#if q.author.faculty?.short_name}
						<span class="text-xs font-medium px-2 py-0.5 rounded-bazar-pill bg-bazar-purple/10 text-bazar-purple">
							{q.author.faculty.short_name}
						</span>
					{/if}
				{/if}
				<span class="text-xs text-bazar-gray-500">{relativeTime(q.created_at)}</span>
			</div>
		</div>

		<!-- Answers -->
		<h2 class="text-lg font-heading font-bold text-bazar-dark mb-4">
			{data.answers.length} {data.answers.length === 1 ? 'raspuns' : 'raspunsuri'}
		</h2>

		{#if data.answers.length === 0}
			<div class="text-center py-8 text-bazar-gray-500 text-sm">
				Niciun raspuns inca. Fii primul care raspunde!
			</div>
		{:else}
			<div class="space-y-3 mb-8">
				{#each data.answers as answer (answer.id)}
					<div class="bg-white rounded-bazar-md border-2 border-bazar-gray-100 p-4">
						<!-- Author -->
						<div class="flex items-center gap-2 mb-2">
							{#if answer.author}
								<span class="text-sm font-medium text-bazar-dark">{answer.author.full_name}</span>
								{#if answer.author.year}
									<span class="text-xs font-medium px-2 py-0.5 rounded-bazar-pill {yearBadgeClass(answer.author.year)}">
										Anul {answer.author.year}
									</span>
								{/if}
							{/if}
							<span class="text-xs text-bazar-gray-500">{relativeTime(answer.created_at)}</span>
						</div>

						<!-- Body -->
						<p class="text-[15px] text-bazar-dark leading-relaxed mb-3 break-words">{answer.body}</p>

						<!-- Upvote -->
						<button
							onclick={() => toggleVote(answer.id)}
							disabled={!isVerified}
							class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-bazar-sm border-2 transition-all
								{votedIds.has(answer.id)
									? 'border-bazar-purple bg-bazar-purple/10 text-bazar-purple font-medium'
									: 'border-bazar-gray-200 text-bazar-gray-500 hover:border-bazar-gray-300'}
								{!isVerified ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
						>
							<span class="text-xs">&#9650;</span>
							{answerUpvotes[answer.id] ?? 0}
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Answer form -->
		{#if isVerified}
			<div class="bg-white rounded-bazar-md border-2 border-bazar-gray-100 p-5">
				<h3 class="text-sm font-semibold text-bazar-dark mb-3">Raspunde</h3>

				{#if form?.error}
					<div class="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-bazar-sm text-sm text-red-700">
						{form.error}
					</div>
				{/if}

				<form
					method="POST"
					action="?/answer"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							submitting = false;
							answerText = '';
							await update();
						};
					}}
				>
					<textarea
						name="body"
						bind:value={answerText}
						rows="3"
						placeholder="Scrie raspunsul tau..."
						class="w-full px-4 py-2.5 text-[15px] text-bazar-dark placeholder:text-bazar-gray-500 border-2 border-bazar-gray-200 rounded-bazar-sm focus:border-bazar-dark focus:outline-none transition-colors resize-y mb-3"
					></textarea>
					<button
						type="submit"
						disabled={submitting || !answerText.trim()}
						class="px-6 py-2.5 text-sm font-medium bg-bazar-dark text-white rounded-bazar-sm transition-opacity
							{submitting || !answerText.trim() ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}"
					>
						{submitting ? 'Se trimite...' : 'Raspunde'}
					</button>
				</form>
			</div>
		{:else}
			<div class="text-center py-4 px-4 bg-amber-50 border border-amber-200 rounded-bazar-sm text-sm text-amber-800">
				<a href="/profile" class="underline hover:no-underline">Verifica-te</a> pentru a raspunde si vota.
			</div>
		{/if}
	</div>
{/if}
