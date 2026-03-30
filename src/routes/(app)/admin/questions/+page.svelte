<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let deleteConfirmId: string | null = $state(null);

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
</script>

<!-- Feedback -->
{#if form?.error}
	<div class="mb-4 px-3 py-2 bg-red-50 rounded-bazar-sm text-sm text-red-700">
		{form.error}
	</div>
{/if}
{#if form?.success}
	<div class="mb-4 px-3 py-2 bg-emerald-50 rounded-bazar-sm text-sm text-emerald-700">
		Operatiune reusita!
	</div>
{/if}

<!-- Questions list -->
<div class="flex flex-col gap-3">
	{#each data.questions as question (question.id)}
		{@const answerCount = question.answers?.[0]?.count ?? 0}
		<div
			class="bg-white rounded-bazar-lg p-4 {question.is_pinned
				? 'ring-2 ring-bazar-yellow'
				: ''}"
		>
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2 mb-1">
						{#if question.is_pinned}
							<span class="text-sm" title="Fixat">📌</span>
						{/if}
						<h3 class="font-heading font-bold text-base text-bazar-dark">
							{question.title}
						</h3>
					</div>
					<div class="flex items-center gap-2 flex-wrap">
						<span class="text-xs text-bazar-gray-500">
							{question.author?.full_name ?? 'Necunoscut'}
						</span>
						<span class="text-xs text-bazar-gray-400">
							{answerCount}
							{answerCount === 1 ? 'raspuns' : 'raspunsuri'}
						</span>
						<span class="text-xs text-bazar-gray-400">
							{relativeTime(question.created_at)}
						</span>
					</div>
				</div>
				<a
					href="/qa/{question.id}"
					class="shrink-0 px-3 py-1.5 text-xs font-medium text-bazar-gray-700 hover:bg-bazar-gray-100 rounded-full transition-colors"
				>
					Vezi
				</a>
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-1 mt-3 pt-3 border-t border-bazar-gray-100">
				<form method="POST" action="?/togglePin" use:enhance class="contents">
					<input type="hidden" name="id" value={question.id} />
					<input type="hidden" name="is_pinned" value={String(question.is_pinned)} />
					<button
						type="submit"
						class="px-3 py-1.5 text-xs font-medium text-bazar-gray-700 hover:bg-bazar-gray-100 rounded-full transition-colors"
					>
						{question.is_pinned ? 'Anuleaza fixare' : 'Fixeaza'}
					</button>
				</form>

				{#if deleteConfirmId === question.id}
					<form method="POST" action="?/delete" use:enhance class="contents">
						<input type="hidden" name="id" value={question.id} />
						<button
							type="submit"
							class="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
						>
							Confirma stergerea
						</button>
					</form>
					<button
						type="button"
						onclick={() => (deleteConfirmId = null)}
						class="px-3 py-1.5 text-xs font-medium text-bazar-gray-500 hover:bg-bazar-gray-100 rounded-full transition-colors"
					>
						Anuleaza
					</button>
				{:else}
					<button
						type="button"
						onclick={() => (deleteConfirmId = question.id)}
						class="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors"
					>
						Sterge
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<div class="text-center py-12 text-bazar-gray-500">
			<p class="text-lg">Nicio intrebare momentan.</p>
		</div>
	{/each}
</div>
