<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let showCreateForm = $state(false);
	let editingId: string | null = $state(null);
	let deleteConfirmId: string | null = $state(null);

	function relativeTime(dateStr: string): string {
		const now = Date.now();
		const then = new Date(dateStr).getTime();
		const diff = now - then;
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'acum';
		if (mins < 60) return `acum ${mins} min`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `acum ${hours}h`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `acum ${days}z`;
		const months = Math.floor(days / 30);
		return `acum ${months} luni`;
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

<!-- Create button -->
<button
	type="button"
	onclick={() => (showCreateForm = !showCreateForm)}
	class="mb-4 px-5 py-2.5 text-sm font-medium bg-bazar-yellow text-bazar-dark rounded-full hover:opacity-90 transition-opacity"
>
	{showCreateForm ? 'Anuleaza' : 'Creeaza anunt'}
</button>

<!-- Create form -->
{#if showCreateForm}
	<div class="bg-white rounded-bazar-lg p-4 mb-4">
		<h2 class="font-heading font-bold text-lg text-bazar-dark mb-3">Anunt nou</h2>
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					showCreateForm = false;
				};
			}}
			class="space-y-3"
		>
			<div>
				<label for="create-title" class="block text-sm font-medium text-bazar-dark mb-1">Titlu</label>
				<input
					id="create-title"
					name="title"
					type="text"
					required
					class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
				/>
			</div>
			<div>
				<label for="create-body" class="block text-sm font-medium text-bazar-dark mb-1">Continut</label>
				<textarea
					id="create-body"
					name="body"
					rows="4"
					required
					class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 resize-none"
				></textarea>
			</div>
			<div>
				<label for="create-category" class="block text-sm font-medium text-bazar-dark mb-1">
					Categorie <span class="text-bazar-gray-500 font-normal">(optional)</span>
				</label>
				<input
					id="create-category"
					name="category"
					type="text"
					placeholder="Ex: important, cazare, acte"
					class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
				/>
			</div>
			<button
				type="submit"
				class="px-5 py-2.5 text-sm font-medium bg-bazar-yellow text-bazar-dark rounded-full hover:opacity-90 transition-opacity"
			>
				Publica
			</button>
		</form>
	</div>
{/if}

<!-- Announcements list -->
<div class="flex flex-col gap-3">
	{#each data.announcements as announcement (announcement.id)}
		<div class="bg-white rounded-bazar-lg p-4">
			{#if editingId === announcement.id}
				<!-- Inline edit form -->
				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							editingId = null;
						};
					}}
					class="space-y-3"
				>
					<input type="hidden" name="id" value={announcement.id} />
					<div>
						<label for="edit-title-{announcement.id}" class="block text-sm font-medium text-bazar-dark mb-1">Titlu</label>
						<input
							id="edit-title-{announcement.id}"
							name="title"
							type="text"
							value={announcement.title}
							required
							class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
						/>
					</div>
					<div>
						<label for="edit-body-{announcement.id}" class="block text-sm font-medium text-bazar-dark mb-1">Continut</label>
						<textarea
							id="edit-body-{announcement.id}"
							name="body"
							rows="4"
							required
							class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 resize-none"
						>{announcement.body}</textarea>
					</div>
					<div>
						<label for="edit-category-{announcement.id}" class="block text-sm font-medium text-bazar-dark mb-1">Categorie</label>
						<input
							id="edit-category-{announcement.id}"
							name="category"
							type="text"
							value={announcement.category ?? ''}
							class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
						/>
					</div>
					<div class="flex gap-2">
						<button
							type="submit"
							class="px-4 py-2 text-sm font-medium bg-bazar-yellow text-bazar-dark rounded-full hover:opacity-90 transition-opacity"
						>
							Salveaza
						</button>
						<button
							type="button"
							onclick={() => (editingId = null)}
							class="px-4 py-2 text-sm font-medium text-bazar-gray-500 hover:text-bazar-dark transition-colors"
						>
							Anuleaza
						</button>
					</div>
				</form>
			{:else}
				<!-- Display mode -->
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2 mb-1">
							{#if announcement.is_pinned}
								<span class="text-sm" title="Fixat">📌</span>
							{/if}
							<h3 class="font-heading font-bold text-base text-bazar-dark">{announcement.title}</h3>
						</div>
						<p class="text-sm text-bazar-gray-700 line-clamp-2 mb-2">{announcement.body}</p>
						<div class="flex items-center gap-2 flex-wrap">
							{#if announcement.category}
								<span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-bazar-gray-100 text-bazar-gray-700">
									{announcement.category}
								</span>
							{/if}
							<span class="text-xs text-bazar-gray-500">
								{announcement.author?.full_name ?? 'Necunoscut'}
							</span>
							<span class="text-xs text-bazar-gray-400">
								{relativeTime(announcement.created_at)}
							</span>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center gap-1 mt-3 pt-3 border-t border-bazar-gray-100">
					<button
						type="button"
						onclick={() => (editingId = announcement.id)}
						class="px-3 py-1.5 text-xs font-medium text-bazar-gray-700 hover:bg-bazar-gray-100 rounded-full transition-colors"
					>
						Editeaza
					</button>

					<form method="POST" action="?/togglePin" use:enhance class="contents">
						<input type="hidden" name="id" value={announcement.id} />
						<input type="hidden" name="is_pinned" value={String(announcement.is_pinned)} />
						<button
							type="submit"
							class="px-3 py-1.5 text-xs font-medium text-bazar-gray-700 hover:bg-bazar-gray-100 rounded-full transition-colors"
						>
							{announcement.is_pinned ? 'Anuleaza fixare' : 'Fixeaza'}
						</button>
					</form>

					{#if deleteConfirmId === announcement.id}
						<form method="POST" action="?/delete" use:enhance class="contents">
							<input type="hidden" name="id" value={announcement.id} />
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
							onclick={() => (deleteConfirmId = announcement.id)}
							class="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors"
						>
							Sterge
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div class="text-center py-12 text-bazar-gray-500">
			<p class="text-lg">Niciun anunt momentan.</p>
			<p class="text-sm mt-1">Creeaza primul anunt folosind butonul de mai sus.</p>
		</div>
	{/each}
</div>
