<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let submitting = $state(false);

	const facultyId = $derived(data.profile?.faculty_id);
	const facultyName = $derived(data.profile?.faculty?.short_name);
</script>

<div class="px-5 py-6 max-w-2xl mx-auto">
	<!-- Back -->
	<a
		href="/qa"
		class="inline-flex items-center gap-1 text-sm text-bazar-gray-500 hover:text-bazar-dark mb-6 transition-colors"
	>
		&larr; Intrebari
	</a>

	<h1 class="text-2xl font-heading font-bold text-bazar-dark mb-6">Pune o intrebare</h1>

	{#if form?.error}
		<div class="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-bazar-sm text-sm text-red-700">
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
			};
		}}
		class="space-y-5"
	>
		<!-- Title -->
		<div>
			<label for="title" class="block text-sm font-medium text-bazar-dark mb-1.5">
				Titlu <span class="text-red-500">*</span>
			</label>
			<input
				type="text"
				id="title"
				name="title"
				required
				placeholder="Ce vrei sa intrebi?"
				class="w-full px-4 py-2.5 text-[15px] text-bazar-dark placeholder:text-bazar-gray-500 border-2 border-bazar-gray-200 rounded-bazar-sm focus:border-bazar-dark focus:outline-none transition-colors"
			/>
		</div>

		<!-- Body -->
		<div>
			<label for="body" class="block text-sm font-medium text-bazar-dark mb-1.5">
				Detalii (optional)
			</label>
			<textarea
				id="body"
				name="body"
				rows="4"
				placeholder="Adauga detalii sau context..."
				class="w-full px-4 py-2.5 text-[15px] text-bazar-dark placeholder:text-bazar-gray-500 border-2 border-bazar-gray-200 rounded-bazar-sm focus:border-bazar-dark focus:outline-none transition-colors resize-y"
			></textarea>
		</div>

		<!-- Faculty select -->
		<div>
			<label for="faculty_id" class="block text-sm font-medium text-bazar-dark mb-1.5">
				Categorie
			</label>
			<select
				id="faculty_id"
				name="faculty_id"
				class="w-full px-4 py-2.5 text-[15px] text-bazar-dark border-2 border-bazar-gray-200 rounded-bazar-sm focus:border-bazar-dark focus:outline-none transition-colors bg-white"
			>
				<option value="">General</option>
				{#if facultyId && facultyName}
					<option value={facultyId}>{facultyName}</option>
				{/if}
			</select>
		</div>

		<!-- Submit -->
		<button
			type="submit"
			disabled={submitting}
			class="w-full py-3 text-sm font-medium bg-bazar-dark text-white rounded-bazar-sm transition-opacity
				{submitting ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}"
		>
			{submitting ? 'Se publica...' : 'Publica'}
		</button>
	</form>
</div>
