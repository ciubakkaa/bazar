<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let showCreateForm = $state(false);
	let editingId: string | null = $state(null);
	let deleteConfirmId: string | null = $state(null);

	const categories = [
		{ value: 'documents', label: 'Acte' },
		{ value: 'housing', label: 'Cazare' },
		{ value: 'registration', label: 'Inregistrare' },
		{ value: 'campus', label: 'Campus' },
		{ value: 'transport', label: 'Transport' },
		{ value: 'health', label: 'Sanatate' }
	];

	const categoryLabelMap: Record<string, string> = Object.fromEntries(
		categories.map((c) => [c.value, c.label])
	);

	const categoryColorMap: Record<string, string> = {
		documents: 'bg-blue-50 text-blue-700',
		housing: 'bg-green-50 text-green-700',
		registration: 'bg-purple-50 text-purple-700',
		campus: 'bg-amber-50 text-amber-700',
		transport: 'bg-cyan-50 text-cyan-700',
		health: 'bg-rose-50 text-rose-700'
	};
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
	{showCreateForm ? 'Anuleaza' : 'Adauga item'}
</button>

<!-- Create form -->
{#if showCreateForm}
	<div class="bg-white rounded-bazar-lg p-4 mb-4">
		<h2 class="font-heading font-bold text-lg text-bazar-dark mb-3">Item nou</h2>
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
			<input type="hidden" name="university_id" value={data.universityId ?? ''} />
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
				<label for="create-description" class="block text-sm font-medium text-bazar-dark mb-1">
					Descriere <span class="text-bazar-gray-500 font-normal">(optional)</span>
				</label>
				<textarea
					id="create-description"
					name="description"
					rows="3"
					class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 resize-none"
				></textarea>
			</div>
			<div>
				<label for="create-category" class="block text-sm font-medium text-bazar-dark mb-1">Categorie</label>
				<select
					id="create-category"
					name="category"
					required
					class="w-full bg-white rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
				>
					<option value="" disabled selected>Selecteaza o categorie</option>
					{#each categories as cat}
						<option value={cat.value}>{cat.label}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="create-deadline" class="block text-sm font-medium text-bazar-dark mb-1">
					Termen limita <span class="text-bazar-gray-500 font-normal">(optional)</span>
				</label>
				<input
					id="create-deadline"
					name="deadline_description"
					type="text"
					placeholder="Ex: Pana la 15 septembrie"
					class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
				/>
			</div>
			<div>
				<label for="create-url" class="block text-sm font-medium text-bazar-dark mb-1">
					URL <span class="text-bazar-gray-500 font-normal">(optional)</span>
				</label>
				<input
					id="create-url"
					name="url"
					type="url"
					placeholder="https://..."
					class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
				/>
			</div>
			<div>
				<label for="create-sort-order" class="block text-sm font-medium text-bazar-dark mb-1">
					Ordine <span class="text-bazar-gray-500 font-normal">(optional)</span>
				</label>
				<input
					id="create-sort-order"
					name="sort_order"
					type="number"
					value="0"
					class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
				/>
			</div>
			<button
				type="submit"
				class="px-5 py-2.5 text-sm font-medium bg-bazar-yellow text-bazar-dark rounded-full hover:opacity-90 transition-opacity"
			>
				Adauga
			</button>
		</form>
	</div>
{/if}

<!-- Templates list -->
<div class="flex flex-col gap-3">
	{#each data.templates as template (template.id)}
		<div class="bg-white rounded-bazar-lg p-4">
			{#if editingId === template.id}
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
					<input type="hidden" name="id" value={template.id} />
					<input type="hidden" name="university_id" value={template.university_id ?? data.universityId ?? ''} />
					<div>
						<label for="edit-title-{template.id}" class="block text-sm font-medium text-bazar-dark mb-1">Titlu</label>
						<input
							id="edit-title-{template.id}"
							name="title"
							type="text"
							value={template.title}
							required
							class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
						/>
					</div>
					<div>
						<label for="edit-description-{template.id}" class="block text-sm font-medium text-bazar-dark mb-1">Descriere</label>
						<textarea
							id="edit-description-{template.id}"
							name="description"
							rows="3"
							class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 resize-none"
						>{template.description ?? ''}</textarea>
					</div>
					<div>
						<label for="edit-category-{template.id}" class="block text-sm font-medium text-bazar-dark mb-1">Categorie</label>
						<select
							id="edit-category-{template.id}"
							name="category"
							required
							class="w-full bg-white rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
						>
							{#each categories as cat}
								<option value={cat.value} selected={template.category === cat.value}>{cat.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="edit-deadline-{template.id}" class="block text-sm font-medium text-bazar-dark mb-1">Termen limita</label>
						<input
							id="edit-deadline-{template.id}"
							name="deadline_description"
							type="text"
							value={template.deadline_description ?? ''}
							class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
						/>
					</div>
					<div>
						<label for="edit-url-{template.id}" class="block text-sm font-medium text-bazar-dark mb-1">URL</label>
						<input
							id="edit-url-{template.id}"
							name="url"
							type="url"
							value={template.url ?? ''}
							class="w-full bg-bazar-gray-100 rounded-bazar-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50"
						/>
					</div>
					<div>
						<label for="edit-sort-order-{template.id}" class="block text-sm font-medium text-bazar-dark mb-1">Ordine</label>
						<input
							id="edit-sort-order-{template.id}"
							name="sort_order"
							type="number"
							value={template.sort_order ?? 0}
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
							<h3 class="font-heading font-bold text-base text-bazar-dark">{template.title}</h3>
							<span class="text-xs font-medium px-2.5 py-0.5 rounded-full {categoryColorMap[template.category] ?? 'bg-bazar-gray-100 text-bazar-gray-700'}">
								{categoryLabelMap[template.category] ?? template.category}
							</span>
							<span class="text-xs text-bazar-gray-400 tabular-nums">#{template.sort_order ?? 0}</span>
						</div>
						{#if template.description}
							<p class="text-sm text-bazar-gray-700 line-clamp-2 mb-1">{template.description}</p>
						{/if}
						{#if template.deadline_description}
							<p class="text-xs text-bazar-gray-500">Termen: {template.deadline_description}</p>
						{/if}
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center gap-1 mt-3 pt-3 border-t border-bazar-gray-100">
					<button
						type="button"
						onclick={() => (editingId = template.id)}
						class="px-3 py-1.5 text-xs font-medium text-bazar-gray-700 hover:bg-bazar-gray-100 rounded-full transition-colors"
					>
						Editeaza
					</button>

					{#if deleteConfirmId === template.id}
						<form method="POST" action="?/delete" use:enhance class="contents">
							<input type="hidden" name="id" value={template.id} />
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
							onclick={() => (deleteConfirmId = template.id)}
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
			<p class="text-lg">Niciun item in checklist.</p>
			<p class="text-sm mt-1">Adauga primul item folosind butonul de mai sus.</p>
		</div>
	{/each}
</div>
