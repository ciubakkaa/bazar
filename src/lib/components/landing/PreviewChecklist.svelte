<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	const items = $derived([
		{ label: m.preview_checklist_item1(), tag: m.tag_acte(), tagClass: 'bg-blue-100 text-blue-800', done: true },
		{ label: m.preview_checklist_item2(), tag: m.tag_cazare(), tagClass: 'bg-green-100 text-green-800', done: true },
		{ label: m.preview_checklist_item3(), tag: m.tag_acte(), tagClass: 'bg-blue-100 text-blue-800', done: true },
		{ label: m.preview_checklist_item4(), tag: m.tag_acte(), tagClass: 'bg-blue-100 text-blue-800', done: false },
		{ label: m.preview_checklist_item5(), tag: m.tag_cazare(), tagClass: 'bg-green-100 text-green-800', done: false },
		{ label: m.preview_checklist_item6(), tag: m.tag_comunitate(), tagClass: 'bg-purple-100 text-purple-800', done: false }
	]);
</script>

<div
	class="bg-white rounded-bazar-xl p-5 md:p-6 shadow-[0_8px_40px_rgba(44,47,48,0.04)] pointer-events-none select-none"
>
	<div class="flex items-center justify-between mb-4">
		<div>
			<div class="font-heading font-bold text-lg">{m.preview_checklist_title()}</div>
			<div class="text-[12px] text-bazar-gray-500">{m.preview_checklist_progress()}</div>
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
