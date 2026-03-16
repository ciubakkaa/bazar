<script lang="ts">
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/supabase';
	import { QUIZ_QUESTIONS } from '$lib/constants';

	let { data } = $props();

	const supabase = createClient();
	const totalQuestions = QUIZ_QUESTIONS.length;

	let currentIndex = $state(0);
	let answers: Record<string, number> = $state({});
	let submitting = $state(false);

	// Pre-populate from existing answers
	$effect(() => {
		if (data.existingAnswers) {
			const existing = data.existingAnswers;
			for (const q of QUIZ_QUESTIONS) {
				if (existing[q.key] != null) {
					answers[q.key] = existing[q.key] as number;
				}
			}
		}
	});

	const currentQuestion = $derived(QUIZ_QUESTIONS[currentIndex]);
	const progressPercent = $derived(((currentIndex + 1) / totalQuestions) * 100);
	const isFirstQuestion = $derived(currentIndex === 0);
	const isLastQuestion = $derived(currentIndex === totalQuestions - 1);
	const isAnswered = $derived(answers[currentQuestion.key] != null);

	function goBack() {
		if (currentIndex > 0) currentIndex--;
	}

	function goNext() {
		if (!isAnswered) return;
		if (currentIndex < totalQuestions - 1) {
			currentIndex++;
		}
	}

	async function handleFinish() {
		if (!isAnswered || submitting) return;
		submitting = true;

		const { data: authData } = await supabase.auth.getUser();
		if (!authData.user) return;

		await supabase.from('quiz_answers').upsert({
			profile_id: authData.user.id,
			...answers
		});

		goto('/people');
	}

	function selectSliderValue(value: number) {
		answers[currentQuestion.key] = value;
	}

	function selectChoiceValue(value: number) {
		answers[currentQuestion.key] = value;
	}
</script>

<div class="px-5 py-6 max-w-lg mx-auto min-h-[80vh] flex flex-col">
	<!-- Progress bar -->
	<div class="mb-2">
		<div class="h-1.5 bg-bazar-gray-200 rounded-bazar-pill overflow-hidden">
			<div
				class="h-full bg-bazar-yellow rounded-bazar-pill transition-all duration-500 ease-out"
				style="width: {progressPercent}%"
			></div>
		</div>
	</div>

	<!-- Question counter -->
	<div class="text-sm text-bazar-gray-500 mb-8">
		{currentIndex + 1} / {totalQuestions}
	</div>

	<!-- Question area (grows to fill space) -->
	<div class="flex-1 flex flex-col">
		<!-- Question text -->
		<h2 class="text-xl font-bold font-heading text-bazar-dark mb-8">
			{currentQuestion.question}
		</h2>

		<!-- Answer area -->
		<div class="flex-1 flex flex-col justify-center">
			{#if currentQuestion.type === 'slider'}
				{@const q = currentQuestion}
				{@const currentValue = answers[q.key]}
				<div class="space-y-6">
					<!-- Slider dots -->
					<div class="flex items-center justify-between px-1">
						{#each { length: q.max - q.min + 1 } as _, i}
							{@const value = q.min + i}
							<button
								onclick={() => selectSliderValue(value)}
								class="relative flex flex-col items-center gap-2 md:gap-3 group"
							>
								<div
									class="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-sm font-semibold
										{currentValue === value
											? 'bg-bazar-yellow border-bazar-yellow text-bazar-dark scale-110'
											: 'bg-white border-bazar-gray-200 text-bazar-gray-400 hover:border-bazar-gray-300 hover:scale-105'}"
								>
									{value}
								</div>
								<span
									class="text-[10px] md:text-xs transition-colors duration-200 max-w-[56px] md:max-w-[72px] text-center leading-tight
										{currentValue === value
											? 'text-bazar-dark font-semibold'
											: 'text-bazar-gray-500'}"
								>
									{q.labels[i]}
								</span>
							</button>
						{/each}
					</div>
				</div>
			{:else if currentQuestion.type === 'choice'}
				{@const q = currentQuestion}
				{@const currentValue = answers[q.key]}
				<div class="flex flex-col gap-3">
					{#each q.options as option}
						<button
							onclick={() => selectChoiceValue(option.value)}
							class="w-full text-left px-5 py-4 rounded-bazar-md border-2 transition-all duration-200
								{currentValue === option.value
									? 'border-bazar-yellow bg-yellow-50 font-medium shadow-sm'
									: 'bg-white border-bazar-gray-100 hover:border-bazar-gray-200'}"
						>
							<span class="text-base text-bazar-dark">{option.label}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Navigation -->
	<div class="flex items-center justify-between pt-6 mt-auto">
		{#if !isFirstQuestion}
			<button
				onclick={goBack}
				class="px-5 py-2.5 text-sm font-medium text-bazar-dark border-2 border-bazar-gray-200 rounded-bazar-sm hover:border-bazar-gray-300 transition-colors"
			>
				Inapoi
			</button>
		{:else}
			<div></div>
		{/if}

		{#if isLastQuestion}
			<button
				onclick={handleFinish}
				disabled={!isAnswered || submitting}
				class="px-6 py-2.5 text-sm font-medium bg-bazar-dark text-white rounded-bazar-sm transition-opacity
					{!isAnswered || submitting ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}"
			>
				{submitting ? 'Se salveaza...' : 'Gata!'}
			</button>
		{:else}
			<button
				onclick={goNext}
				disabled={!isAnswered}
				class="px-6 py-2.5 text-sm font-medium bg-bazar-dark text-white rounded-bazar-sm transition-opacity
					{!isAnswered ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}"
			>
				Continua
			</button>
		{/if}
	</div>
</div>
