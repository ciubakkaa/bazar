<script lang="ts">
	let { data } = $props();

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function relativeTime(dateStr: string | null) {
		if (!dateStr) return '';
		const now = Date.now();
		const then = new Date(dateStr).getTime();
		const diff = Math.floor((now - then) / 1000);

		if (diff < 60) return 'acum';
		if (diff < 3600) return `${Math.floor(diff / 60)} min`;
		if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
		if (diff < 604800) return `${Math.floor(diff / 86400)} z`;
		return new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
	}

	function truncate(text: string | undefined | null, max: number) {
		if (!text) return '';
		return text.length > max ? text.slice(0, max) + '...' : text;
	}

	function displayName(conv: any) {
		if (conv.type === 'faculty' && conv.name) return conv.name;
		return conv.other_member?.full_name ?? 'Conversație';
	}

	const facultyChats = $derived(
		(data.conversations ?? []).filter((c: any) => c.type === 'faculty')
	);
	const dmChats = $derived(
		(data.conversations ?? []).filter((c: any) => c.type !== 'faculty')
	);
</script>

<div class="px-5 py-6 max-w-3xl mx-auto">
	<h1 class="text-2xl font-heading font-bold text-bazar-dark mb-6">Mesaje</h1>

	{#if !data.conversations?.length}
		<div class="text-center py-16">
			<div class="text-5xl mb-4">💬</div>
			<p class="text-bazar-gray-500 text-lg mb-1">Niciun mesaj inca.</p>
			<p class="text-bazar-gray-500 text-sm">
				Cauta colegi si trimite primul mesaj!
			</p>
			<a
				href="/people"
				class="inline-block mt-4 px-5 py-2.5 bg-bazar-dark text-white rounded-bazar-pill font-medium text-sm hover:bg-bazar-dark/90 transition-colors"
			>
				Cauta colegi
			</a>
		</div>
	{:else}
		<!-- Faculty group chats -->
		{#if facultyChats.length > 0}
			<div class="mb-6">
				<h2 class="text-sm font-semibold text-bazar-gray-500 uppercase tracking-wide mb-3">
					Grupuri
				</h2>
				<div class="flex flex-col gap-1">
					{#each facultyChats as conv (conv.id)}
						<a
							href="/messages/{conv.id}"
							class="flex items-center gap-3 px-4 py-3 bg-white rounded-bazar-md border border-bazar-gray-100 hover:border-bazar-gray-300 hover:shadow-sm transition-all"
						>
							<div
								class="w-11 h-11 rounded-full bg-bazar-yellow/30 flex items-center justify-center text-lg shrink-0"
							>
								🎓
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between gap-2">
									<span class="font-semibold text-bazar-dark truncate">{conv.name ?? 'Grup'}</span>
									<span class="text-[11px] text-bazar-gray-500 shrink-0">
										{relativeTime(conv.last_message?.created_at ?? conv.last_message_at)}
									</span>
								</div>
								{#if conv.last_message}
									<p class="text-sm text-bazar-gray-500 truncate mt-0.5">
										{truncate(conv.last_message.content, 50)}
									</p>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- DM conversations -->
		{#if dmChats.length > 0}
			{#if facultyChats.length > 0}
				<h2 class="text-sm font-semibold text-bazar-gray-500 uppercase tracking-wide mb-3">
					Mesaje directe
				</h2>
			{/if}
			<div class="flex flex-col gap-1">
				{#each dmChats as conv (conv.id)}
					<a
						href="/messages/{conv.id}"
						class="flex items-center gap-3 px-4 py-3 bg-white rounded-bazar-md border border-bazar-gray-100 hover:border-bazar-gray-300 hover:shadow-sm transition-all"
					>
						<!-- Avatar -->
						{#if conv.other_member?.avatar_url}
							<img
								src={conv.other_member.avatar_url}
								alt={conv.other_member.full_name}
								class="w-11 h-11 rounded-full object-cover shrink-0"
							/>
						{:else}
							<div
								class="w-11 h-11 rounded-full bg-gradient-to-br from-bazar-purple to-bazar-orange flex items-center justify-center text-white font-bold text-xs shrink-0"
							>
								{getInitials(conv.other_member?.full_name ?? '??')}
							</div>
						{/if}

						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between gap-2">
								<span class="font-semibold text-bazar-dark truncate">
									{displayName(conv)}
								</span>
								<span class="text-[11px] text-bazar-gray-500 shrink-0">
									{relativeTime(conv.last_message?.created_at ?? conv.last_message_at)}
								</span>
							</div>
							{#if conv.last_message}
								<p class="text-sm text-bazar-gray-500 truncate mt-0.5">
									{truncate(conv.last_message.content, 50)}
								</p>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>
