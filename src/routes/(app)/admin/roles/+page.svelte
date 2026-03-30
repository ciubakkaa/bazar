<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let search = $state('');

	const roleLabelMap: Record<string, string> = {
		student: 'Student',
		class_lead: 'Class Lead',
		asmi: 'ASMI',
		admin: 'Admin'
	};

	const roleBadgeColors: Record<string, string> = {
		student: 'bg-gray-100 text-gray-700',
		class_lead: 'bg-blue-100 text-blue-700',
		asmi: 'bg-purple-100 text-purple-700',
		admin: 'bg-yellow-100 text-yellow-700'
	};

	const filteredUsers = $derived(
		data.users.filter((u: any) =>
			u.full_name?.toLowerCase().includes(search.toLowerCase())
		)
	);
</script>

<!-- Feedback -->
{#if form?.error}
	<div class="mb-4 px-3 py-2 bg-red-50 rounded-bazar-sm text-sm text-red-700">
		{form.error}
	</div>
{/if}
{#if form?.success}
	<div class="mb-4 px-3 py-2 bg-emerald-50 rounded-bazar-sm text-sm text-emerald-700">
		Rolul a fost actualizat!
	</div>
{/if}

<!-- Search -->
<div class="mb-4">
	<input
		type="text"
		placeholder="Cauta dupa nume..."
		bind:value={search}
		class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
	/>
</div>

<!-- Users list -->
<div class="flex flex-col gap-3">
	{#each filteredUsers as user (user.id)}
		<form
			method="POST"
			action="?/setRole"
			use:enhance
			class="bg-white rounded-bazar-lg p-4"
		>
			<input type="hidden" name="user_id" value={user.id} />

			<div class="flex items-center justify-between gap-3 flex-wrap">
				<!-- User info -->
				<div class="flex items-center gap-2 min-w-0 flex-1">
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<span class="font-bold text-sm text-bazar-dark truncate">{user.full_name ?? 'Fara nume'}</span>
							{#if user.is_verified}
								<svg class="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
							{/if}
						</div>
						<div class="flex items-center gap-2 mt-0.5">
							{#if user.faculty?.short_name}
								<span class="text-xs text-bazar-gray-500">{user.faculty.short_name}</span>
							{/if}
							<span class="text-xs font-medium px-2.5 py-0.5 rounded-full {roleBadgeColors[user.role ?? 'student'] ?? roleBadgeColors.student}">
								{roleLabelMap[user.role ?? 'student'] ?? user.role}
							</span>
						</div>
					</div>
				</div>

				<!-- Role select + save -->
				<div class="flex items-center gap-2">
					<select
						name="role"
						class="bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
					>
						<option value="student" selected={user.role === 'student' || !user.role}>Student</option>
						<option value="class_lead" selected={user.role === 'class_lead'}>Class Lead</option>
						<option value="asmi" selected={user.role === 'asmi'}>ASMI</option>
						<option value="admin" selected={user.role === 'admin'}>Admin</option>
					</select>
					<button
						type="submit"
						class="bg-bazar-yellow text-bazar-dark rounded-full px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
					>
						Salveaza
					</button>
				</div>
			</div>
		</form>
	{:else}
		<div class="text-center py-12 text-bazar-gray-500">
			{#if search}
				<p class="text-lg">Niciun utilizator gasit.</p>
				<p class="text-sm mt-1">Incearca alt termen de cautare.</p>
			{:else}
				<p class="text-lg">Niciun utilizator.</p>
			{/if}
		</div>
	{/each}
</div>
