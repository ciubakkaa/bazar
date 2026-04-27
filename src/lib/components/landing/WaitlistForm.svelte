<script lang="ts">
	import { enhance } from '$app/forms';
	import UniversityCombobox from './UniversityCombobox.svelte';

	type Props = {
		form?: {
			success?: boolean;
			email?: string;
			error?: string;
			fields?: Record<string, string>;
		} | null;
	};
	let { form }: Props = $props();

	let university = $state('');
	let faculty = $state('');
	let showFeedback = $state(false);
	let submitting = $state(false);

	const years = [
		{ value: 'pre_uni', label: 'Pre-universitar / liceu' },
		{ value: '1', label: 'Anul 1' },
		{ value: '2', label: 'Anul 2' },
		{ value: '3', label: 'Anul 3' },
		{ value: '4', label: 'Anul 4' },
		{ value: '5', label: 'Anul 5' },
		{ value: '6', label: 'Anul 6' }
	];
</script>

<section id="waitlist" class="max-w-[640px] mx-auto px-5 md:px-8 mt-16 md:mt-20">
	<div class="bg-bazar-offwhite rounded-bazar-xl p-6 md:p-10">
		{#if form?.success}
			<div class="text-center py-6">
				<div class="text-5xl mb-3">📬</div>
				<h2 class="font-heading font-bold text-2xl md:text-3xl mb-2">Te-am adaugat!</h2>
				<p class="text-bazar-gray-700">
					Iti scriem la <span class="font-semibold">{form.email}</span> cand lansam Bazar.
				</p>
			</div>
		{:else}
			<div class="mb-6">
				<h2 class="font-heading font-bold text-2xl md:text-3xl mb-2">
					Anunta-ma cand iese Bazar.
				</h2>
				<p class="text-bazar-gray-700">Iti scriem o singura data, cand lansam. Fara spam.</p>
			</div>

			<form
				method="POST"
				action="?/waitlist"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
				class="flex flex-col gap-4"
			>
				<input
					type="text"
					name="website"
					tabindex="-1"
					autocomplete="off"
					class="hidden"
					aria-hidden="true"
				/>

				<div>
					<label class="block text-sm font-semibold mb-1.5" for="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						placeholder="numele.tau@email.com"
						class="w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors"
						value={form?.fields?.email ?? ''}
					/>
				</div>

				<div>
					<label class="block text-sm font-semibold mb-1.5" for="university-input">
						Universitate / facultate
					</label>
					<UniversityCombobox bind:university bind:faculty />
				</div>

				<div>
					<label class="block text-sm font-semibold mb-1.5" for="year_of_study">
						Anul de studiu
					</label>
					<select
						id="year_of_study"
						name="year_of_study"
						required
						class="w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors"
					>
						<option value="">Alege anul</option>
						{#each years as y}
							<option value={y.value} selected={form?.fields?.year_of_study === y.value}>
								{y.label}
							</option>
						{/each}
					</select>
				</div>

				<label class="flex items-start gap-3 cursor-pointer mt-2 select-none">
					<input
						type="checkbox"
						bind:checked={showFeedback}
						class="mt-1 w-4 h-4 accent-bazar-dark"
					/>
					<span class="text-sm text-bazar-gray-700">
						Vreau sa ajut sa-l facem mai bun
					</span>
				</label>

				{#if showFeedback}
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="feedback">
							Care e partea cea mai haotica din inceputul facultatii?
						</label>
						<textarea
							id="feedback"
							name="feedback"
							rows="4"
							maxlength="1000"
							placeholder="Spune-ne orice te frustreaza, te confuzeaza, sau iti ia prea mult timp..."
							class="w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors resize-none"
						></textarea>
					</div>
				{/if}

				{#if form?.error}
					<div
						class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-bazar-sm px-3 py-2"
					>
						{form.error}
					</div>
				{/if}

				<button
					type="submit"
					disabled={submitting}
					class="mt-2 inline-flex items-center justify-center gap-2 bg-gradient-to-br from-bazar-yellow to-bazar-yellow-dim text-bazar-dark px-8 py-3.5 rounded-full font-bold text-base hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
				>
					{submitting ? 'Se trimite...' : 'Trimite →'}
				</button>
			</form>
		{/if}
	</div>
</section>
