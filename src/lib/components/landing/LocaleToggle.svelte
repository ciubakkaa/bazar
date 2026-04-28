<script lang="ts">
	import { page } from '$app/state';
	import { getLocale } from '$lib/paraglide/runtime.js';

	let current = $derived(getLocale());

	function buildUrl(target: string): string {
		const path = page.url.pathname + page.url.search + (page.url.hash || '');
		return `/api/locale?to=${target}&redirect=${encodeURIComponent(path)}`;
	}
</script>

<div class="flex items-center gap-0.5 bg-white rounded-full px-1 py-1 text-[12px] font-bold ml-1">
	<a
		href={buildUrl('ro')}
		class="px-2 py-1 rounded-full no-underline transition-colors {current === 'ro'
			? 'bg-bazar-dark text-white'
			: 'text-bazar-gray-500 hover:text-bazar-dark'}"
		aria-current={current === 'ro' ? 'true' : undefined}
	>
		RO
	</a>
	<a
		href={buildUrl('en')}
		class="px-2 py-1 rounded-full no-underline transition-colors {current === 'en'
			? 'bg-bazar-dark text-white'
			: 'text-bazar-gray-500 hover:text-bazar-dark'}"
		aria-current={current === 'en' ? 'true' : undefined}
	>
		EN
	</a>
</div>
