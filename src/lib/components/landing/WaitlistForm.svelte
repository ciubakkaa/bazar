<script lang="ts">
	import { enhance } from '$app/forms';
	import * as m from '$lib/paraglide/messages.js';
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

	const years = $derived([
		{ value: 'pre_uni', label: m.waitlist_year_pre_uni() },
		{ value: '1', label: m.waitlist_year_1() },
		{ value: '2', label: m.waitlist_year_2() },
		{ value: '3', label: m.waitlist_year_3() },
		{ value: '4', label: m.waitlist_year_4() },
		{ value: '5', label: m.waitlist_year_5() },
		{ value: '6', label: m.waitlist_year_6() }
	]);
</script>

<section id="waitlist" class="max-w-[640px] mx-auto px-5 md:px-8 mt-16 md:mt-20">
	<div class="bg-bazar-offwhite rounded-bazar-xl p-6 md:p-10">
		{#if form?.success}
			<div class="text-center py-6">
				<div class="text-5xl mb-3">📬</div>
				<h2 class="font-heading font-bold text-2xl md:text-3xl mb-2">
					{m.waitlist_success_title()}
				</h2>
				<p class="text-bazar-gray-700">
					{m.waitlist_success_body({ email: form.email ?? '' })}
				</p>
			</div>
		{:else}
			<div class="mb-6">
				<h2 class="font-heading font-bold text-2xl md:text-3xl mb-2">
					{m.waitlist_heading()}
				</h2>
				<p class="text-bazar-gray-700">{m.waitlist_subtitle()}</p>
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
					<label class="block text-sm font-semibold mb-1.5" for="email">
						{m.waitlist_email_label()}
					</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						placeholder={m.waitlist_email_placeholder()}
						class="w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors"
						value={form?.fields?.email ?? ''}
					/>
				</div>

				<div>
					<div class="block text-sm font-semibold mb-1.5">
						{m.waitlist_university_label()}
					</div>
					<UniversityCombobox
						bind:university
						bind:faculty
						placeholder={m.waitlist_university_placeholder()}
						altaPlaceholder={m.waitlist_alta_placeholder()}
						altaOptionLabel={m.waitlist_alta_option()}
					/>
				</div>

				<div>
					<label class="block text-sm font-semibold mb-1.5" for="year_of_study">
						{m.waitlist_year_label()}
					</label>
					<select
						id="year_of_study"
						name="year_of_study"
						required
						class="w-full px-4 py-3 rounded-bazar-sm border border-bazar-gray-200 bg-white text-[15px] focus:outline-none focus:border-bazar-dark transition-colors"
					>
						<option value="">{m.waitlist_year_placeholder()}</option>
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
						{m.waitlist_feedback_checkbox()}
					</span>
				</label>

				{#if showFeedback}
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="feedback">
							{m.waitlist_feedback_label()}
						</label>
						<textarea
							id="feedback"
							name="feedback"
							rows="4"
							maxlength="1000"
							placeholder={m.waitlist_feedback_placeholder()}
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
					{submitting ? m.waitlist_submitting() : m.waitlist_submit() + ' →'}
				</button>
			</form>
		{/if}
	</div>
</section>
