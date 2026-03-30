<script lang="ts">
	import { page } from '$app/state';

	let { data, children } = $props();

	const roleLabelMap: Record<string, string> = {
		class_lead: 'Class Lead',
		asmi: 'ASMI',
		admin: 'Admin'
	};

	const roleLabel = $derived(roleLabelMap[data.role] ?? data.role);

	const tabs = $derived(() => {
		const base = [
			{ href: '/admin', label: 'Anunturi', exact: true },
			{ href: '/admin/checklist', label: 'Checklist' },
			{ href: '/admin/questions', label: 'Intrebari' }
		];
		if (data.role === 'admin') {
			base.push({ href: '/admin/roles', label: 'Roluri' });
		}
		return base;
	});

	function isActive(href: string, exact?: boolean) {
		if (exact) return page.url.pathname === href;
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="px-5 py-6 max-w-3xl mx-auto">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center gap-3 mb-1">
			<h1 class="font-heading font-bold text-2xl md:text-[28px] text-bazar-dark">Admin</h1>
			<span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
				{roleLabel}
			</span>
		</div>
		<p class="text-sm text-bazar-gray-500">Gestioneaza continutul aplicatiei.</p>
	</div>

	<!-- Tab navigation -->
	<div class="flex gap-2 mb-6 overflow-x-auto pb-1">
		{#each tabs() as tab}
			<a
				href={tab.href}
				class="px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors
					{isActive(tab.href, tab.exact)
						? 'bg-bazar-yellow text-bazar-dark'
						: 'bg-white text-bazar-gray-500 hover:bg-bazar-gray-100'}"
			>
				{tab.label}
			</a>
		{/each}
	</div>

	<!-- Page content -->
	{@render children()}
</div>
