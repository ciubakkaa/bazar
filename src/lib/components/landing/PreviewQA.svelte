<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	const items = $derived([
		{
			q: m.preview_qa_q1(),
			a: m.preview_qa_a1(),
			author: m.preview_qa_author1(),
			verified: true
		},
		{
			q: m.preview_qa_q2(),
			a: m.preview_qa_a2(),
			author: m.preview_qa_author2(),
			verified: true
		},
		{
			q: m.preview_qa_q3(),
			a: '',
			author: '',
			verified: false
		}
	]);
</script>

<div
	class="bg-white rounded-bazar-xl p-5 md:p-6 shadow-[0_8px_40px_rgba(44,47,48,0.04)] pointer-events-none select-none"
>
	<div class="flex items-center justify-between mb-4">
		<div>
			<div class="font-heading font-bold text-lg">{m.preview_qa_title()}</div>
			<div class="text-[12px] text-bazar-gray-500">{m.preview_qa_subtitle()}</div>
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
								{m.preview_qa_verified()}
							</span>
						{/if}
					</div>
				</div>
			{:else}
				<div class="text-[12px] text-bazar-gray-500 italic mt-1">{m.preview_qa_pending()}</div>
			{/if}
		</div>
	{/each}
</div>
