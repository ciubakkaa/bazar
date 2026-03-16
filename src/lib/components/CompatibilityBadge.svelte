<script lang="ts">
	let { score }: { score: number | null } = $props();
	let color = $derived(
		score === null
			? ''
			: score >= 75
				? 'bg-green-100 text-green-700'
				: score >= 50
					? 'bg-amber-100 text-amber-700'
					: 'bg-red-100 text-red-700'
	);
</script>

{#if score !== null}
	<span class="text-xs font-semibold px-2.5 py-1 rounded-bazar-pill {color}">
		{score}% compatibil
	</span>
{/if}
