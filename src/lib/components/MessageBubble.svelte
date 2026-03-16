<script lang="ts">
	let {
		content,
		sender_name,
		is_mine,
		timestamp,
		show_sender = false
	}: {
		content: string;
		sender_name: string;
		is_mine: boolean;
		timestamp: string;
		show_sender?: boolean;
	} = $props();

	function formatTime(ts: string) {
		const date = new Date(ts);
		return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="flex {is_mine ? 'justify-end' : 'justify-start'} mb-1.5">
	<div class="max-w-[75%]">
		{#if show_sender && !is_mine}
			<div class="text-xs text-bazar-gray-500 mb-0.5 px-1">{sender_name}</div>
		{/if}
		<div
			class="px-3.5 py-2 text-[15px] leading-snug break-words
				{is_mine
				? 'bg-bazar-dark text-white rounded-2xl rounded-br-md'
				: 'bg-white text-bazar-dark rounded-2xl rounded-bl-md border border-bazar-gray-100'}"
		>
			{content}
		</div>
		<div class="text-[10px] text-bazar-gray-500 mt-0.5 {is_mine ? 'text-right' : 'text-left'} px-1">
			{formatTime(timestamp)}
		</div>
	</div>
</div>
