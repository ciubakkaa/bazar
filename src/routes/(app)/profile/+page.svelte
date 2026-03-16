<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { BUCHAREST_SECTORS } from '$lib/constants';
	import { createClient } from '$lib/supabase';

	let { data, form } = $props();

	let showDeactivateConfirm = $state(false);
	let hasApartment = $state(data.roommatePrefs?.has_apartment ?? false);
	let selectedSectors: string[] = $state(data.roommatePrefs?.preferred_sectors ?? []);

	// Verification state
	let uniEmail = $state('');
	let verificationCode = $state('');
	let verificationStep = $state<'email' | 'code'>('email');
	let verificationLoading = $state(false);
	let verificationError = $state('');
	let verificationSuccess = $state('');

	const supabase = createClient();

	async function sendCode() {
		verificationError = '';
		verificationSuccess = '';
		verificationLoading = true;

		try {
			const { data: result, error } = await supabase.functions.invoke(
				'verify-university-email',
				{ body: { action: 'send-code', email: uniEmail } }
			);

			if (error) {
				verificationError = 'Eroare de conexiune. Incearca din nou.';
				return;
			}

			if (result?.error) {
				verificationError = result.error;
				return;
			}

			verificationStep = 'code';
			verificationSuccess = 'Codul a fost trimis la ' + uniEmail;
		} finally {
			verificationLoading = false;
		}
	}

	async function verifyCode() {
		verificationError = '';
		verificationSuccess = '';
		verificationLoading = true;

		try {
			const { data: result, error } = await supabase.functions.invoke(
				'verify-university-email',
				{ body: { action: 'verify-code', code: verificationCode } }
			);

			if (error) {
				verificationError = 'Eroare de conexiune. Incearca din nou.';
				return;
			}

			if (result?.error) {
				verificationError = result.error;
				return;
			}

			verificationSuccess = 'Email verificat cu succes!';
			await invalidateAll();
		} finally {
			verificationLoading = false;
		}
	}

	// Sync hasApartment when data changes
	$effect(() => {
		hasApartment = data.roommatePrefs?.has_apartment ?? false;
	});

	$effect(() => {
		selectedSectors = data.roommatePrefs?.preferred_sectors ?? [];
	});

	const profile = $derived(data.profile);
	const initials = $derived(
		profile?.full_name
			?.split(' ')
			.map((w: string) => w[0])
			.join('')
			.toUpperCase()
			.slice(0, 2) ?? '??'
	);
	const facultyLine = $derived(
		profile?.faculty
			? `${profile.faculty.name} - ${profile.faculty.university?.name ?? ''}`
			: null
	);

	function toggleSector(sector: string) {
		if (selectedSectors.includes(sector)) {
			selectedSectors = selectedSectors.filter((s) => s !== sector);
		} else {
			selectedSectors = [...selectedSectors, sector];
		}
	}

	const moveInMonths = $derived(() => {
		const months = [];
		const now = new Date();
		for (let i = 0; i < 12; i++) {
			const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
			const value = d.toISOString().slice(0, 7);
			const label = d.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
			months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
		}
		return months;
	});
</script>

<div class="px-5 py-6 max-w-2xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<div
			class="w-16 h-16 rounded-[18px] bg-gradient-to-br from-bazar-purple to-bazar-orange flex items-center justify-center text-white font-bold text-xl shrink-0"
		>
			{initials}
		</div>
		<div>
			<h1 class="font-heading font-bold text-[28px] text-bazar-dark leading-tight">
				{profile?.full_name ?? 'Profil'}
			</h1>
			{#if facultyLine}
				<p class="text-sm text-bazar-gray-500 mt-0.5">{facultyLine}</p>
			{/if}
			{#if profile?.is_verified}
				<span
					class="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-bazar-pill"
				>
					<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Verificat
				</span>
			{/if}
		</div>
	</div>

	<!-- University verification section -->
	{#if profile?.is_verified}
		<div class="bg-emerald-50 border-2 border-emerald-100 rounded-bazar-lg p-4 flex items-center gap-3">
			<svg class="w-5 h-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
					clip-rule="evenodd"
				/>
			</svg>
			<p class="text-sm text-emerald-800 font-medium">
				Verificat cu {profile.university_email ?? 'emailul universitar'}
			</p>
		</div>
	{:else}
		<div class="bg-white rounded-bazar-lg border-2 border-bazar-gray-100 p-6">
			<h2 class="font-heading font-bold text-lg text-bazar-dark mb-2">
				Verificare universitara
			</h2>
			<p class="text-sm text-bazar-gray-500 mb-4">
				Verifica-te cu emailul universitar pentru a aparea in listari si a trimite mesaje.
			</p>

			{#if verificationError}
				<div class="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-bazar-sm text-sm text-red-700">
					{verificationError}
				</div>
			{/if}

			{#if verificationSuccess}
				<div class="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-bazar-sm text-sm text-emerald-700">
					{verificationSuccess}
				</div>
			{/if}

			{#if verificationStep === 'email'}
				<div class="flex gap-2">
					<input
						type="email"
						placeholder="nume@student.univ.ro"
						bind:value={uniEmail}
						class="flex-1 px-3 py-2.5 text-sm border-2 border-bazar-gray-200 rounded-bazar-sm focus:outline-none focus:border-bazar-purple transition-colors"
						disabled={verificationLoading}
					/>
					<button
						type="button"
						onclick={sendCode}
						disabled={verificationLoading || !uniEmail}
						class="px-4 py-2.5 text-sm font-medium rounded-bazar-sm transition-colors
							{verificationLoading || !uniEmail
								? 'bg-bazar-gray-100 text-bazar-gray-400 cursor-not-allowed'
								: 'bg-bazar-purple text-white hover:opacity-90'}"
					>
						{verificationLoading ? 'Se trimite...' : 'Trimite cod'}
					</button>
				</div>
			{:else}
				<p class="text-sm text-bazar-gray-500 mb-3">
					Introdu codul trimis la <strong>{uniEmail}</strong>
				</p>
				<div class="flex gap-2">
					<input
						type="text"
						placeholder="000000"
						maxlength="6"
						bind:value={verificationCode}
						class="flex-1 px-3 py-2.5 text-sm border-2 border-bazar-gray-200 rounded-bazar-sm focus:outline-none focus:border-bazar-purple transition-colors tracking-widest text-center font-mono"
						disabled={verificationLoading}
					/>
					<button
						type="button"
						onclick={verifyCode}
						disabled={verificationLoading || verificationCode.length !== 6}
						class="px-4 py-2.5 text-sm font-medium rounded-bazar-sm transition-colors
							{verificationLoading || verificationCode.length !== 6
								? 'bg-bazar-gray-100 text-bazar-gray-400 cursor-not-allowed'
								: 'bg-bazar-purple text-white hover:opacity-90'}"
					>
						{verificationLoading ? 'Se verifica...' : 'Verifica'}
					</button>
				</div>
				<button
					type="button"
					onclick={() => { verificationStep = 'email'; verificationError = ''; verificationSuccess = ''; verificationCode = ''; }}
					class="mt-2 text-xs text-bazar-purple hover:underline"
				>
					Schimba emailul sau solicita un cod nou
				</button>
			{/if}
		</div>
	{/if}

	<!-- Edit profile section -->
	<div class="bg-white rounded-bazar-lg border-2 border-bazar-gray-100 p-6">
		<h2 class="font-heading font-bold text-lg text-bazar-dark mb-4">Editeaza profilul</h2>

		{#if form?.error}
			<div class="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-bazar-sm text-sm text-red-700">
				{form.error}
			</div>
		{/if}

		<form method="POST" action="?/updateProfile" use:enhance class="space-y-4">
			<div>
				<label for="full_name" class="block text-sm font-medium text-bazar-dark mb-1">
					Nume complet
				</label>
				<input
					id="full_name"
					name="full_name"
					type="text"
					value={profile?.full_name ?? ''}
					required
					class="w-full px-3 py-2.5 text-sm border-2 border-bazar-gray-200 rounded-bazar-sm focus:outline-none focus:border-bazar-purple transition-colors"
				/>
			</div>

			<div>
				<label for="bio" class="block text-sm font-medium text-bazar-dark mb-1">Bio</label>
				<textarea
					id="bio"
					name="bio"
					rows="3"
					class="w-full px-3 py-2.5 text-sm border-2 border-bazar-gray-200 rounded-bazar-sm focus:outline-none focus:border-bazar-purple transition-colors resize-none"
					placeholder="Spune ceva despre tine..."
				>{profile?.bio ?? ''}</textarea>
			</div>

			<div>
				<label for="home_city" class="block text-sm font-medium text-bazar-dark mb-1">
					Orasul de provenienta
				</label>
				<input
					id="home_city"
					name="home_city"
					type="text"
					value={profile?.home_city ?? ''}
					placeholder="Ex: Cluj-Napoca"
					class="w-full px-3 py-2.5 text-sm border-2 border-bazar-gray-200 rounded-bazar-sm focus:outline-none focus:border-bazar-purple transition-colors"
				/>
			</div>

			<button
				type="submit"
				class="w-full py-2.5 text-sm font-medium bg-bazar-dark text-white rounded-bazar-sm hover:opacity-90 transition-opacity"
			>
				Salveaza
			</button>
		</form>
	</div>

	<!-- Quiz section -->
	<div class="bg-white rounded-bazar-lg border-2 border-bazar-gray-100 p-6">
		<h2 class="font-heading font-bold text-lg text-bazar-dark mb-2">Quiz compatibilitate</h2>
		{#if data.quizAnswers}
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="text-sm text-bazar-dark font-medium">Quiz completat</span>
				</div>
				<a
					href="/quiz"
					class="text-sm font-medium text-bazar-purple hover:underline"
				>
					Refa quiz-ul
				</a>
			</div>
		{:else}
			<p class="text-sm text-bazar-gray-500 mb-3">
				Completeaza quiz-ul pentru a vedea compatibilitatea cu ceilalti.
			</p>
			<a
				href="/quiz"
				class="inline-block px-4 py-2.5 text-sm font-medium bg-bazar-yellow text-bazar-dark rounded-bazar-sm hover:opacity-90 transition-opacity"
			>
				Completeaza quiz-ul
			</a>
		{/if}
	</div>

	<!-- Roommate preferences section -->
	<div class="bg-white rounded-bazar-lg border-2 border-bazar-gray-100 p-6">
		<h2 class="font-heading font-bold text-lg text-bazar-dark mb-4">Preferinte coleg de camera</h2>

		<form method="POST" action="?/updateRoommatePrefs" use:enhance class="space-y-5">
			<!-- Budget range -->
			<div>
				<label class="block text-sm font-medium text-bazar-dark mb-2">Buget (RON/luna)</label>
				<div class="flex items-center gap-3">
					<input
						name="budget_min"
						type="number"
						value={data.roommatePrefs?.budget_min ?? ''}
						placeholder="Min"
						min="0"
						class="flex-1 px-3 py-2.5 text-sm border-2 border-bazar-gray-200 rounded-bazar-sm focus:outline-none focus:border-bazar-purple transition-colors"
					/>
					<span class="text-bazar-gray-400">-</span>
					<input
						name="budget_max"
						type="number"
						value={data.roommatePrefs?.budget_max ?? ''}
						placeholder="Max"
						min="0"
						class="flex-1 px-3 py-2.5 text-sm border-2 border-bazar-gray-200 rounded-bazar-sm focus:outline-none focus:border-bazar-purple transition-colors"
					/>
				</div>
			</div>

			<!-- Preferred sectors -->
			<div>
				<label class="block text-sm font-medium text-bazar-dark mb-2">Zone preferate</label>
				<div class="flex flex-wrap gap-2">
					{#each BUCHAREST_SECTORS as sector}
						<button
							type="button"
							onclick={() => toggleSector(sector)}
							class="px-3 py-1.5 text-sm rounded-bazar-pill border-2 transition-colors
								{selectedSectors.includes(sector)
									? 'bg-bazar-purple text-white border-bazar-purple'
									: 'bg-white text-bazar-gray-700 border-bazar-gray-200 hover:border-bazar-gray-300'}"
						>
							{sector}
						</button>
					{/each}
				</div>
				<!-- Hidden inputs for selected sectors -->
				{#each selectedSectors as sector}
					<input type="hidden" name="preferred_sectors" value={sector} />
				{/each}
			</div>

			<!-- Move-in month -->
			<div>
				<label for="move_in_month" class="block text-sm font-medium text-bazar-dark mb-1">
					Luna de mutare
				</label>
				<select
					id="move_in_month"
					name="move_in_month"
					class="w-full px-3 py-2.5 text-sm border-2 border-bazar-gray-200 rounded-bazar-sm focus:outline-none focus:border-bazar-purple transition-colors bg-white"
				>
					<option value="">Selecteaza...</option>
					{#each moveInMonths() as month}
						<option
							value={month.value}
							selected={data.roommatePrefs?.move_in_month === month.value}
						>
							{month.label}
						</option>
					{/each}
				</select>
			</div>

			<!-- Gender preference -->
			<div>
				<label class="block text-sm font-medium text-bazar-dark mb-2">Preferinta gen</label>
				<div class="flex gap-3">
					{#each [
						{ value: 'any', label: 'Oricine' },
						{ value: 'male', label: 'Masculin' },
						{ value: 'female', label: 'Feminin' }
					] as option}
						<label
							class="flex items-center gap-2 px-3 py-2 text-sm border-2 rounded-bazar-sm cursor-pointer transition-colors
								{(data.roommatePrefs?.gender_preference ?? 'any') === option.value
									? 'border-bazar-purple bg-purple-50'
									: 'border-bazar-gray-200 hover:border-bazar-gray-300'}"
						>
							<input
								type="radio"
								name="gender_preference"
								value={option.value}
								checked={(data.roommatePrefs?.gender_preference ?? 'any') === option.value}
								class="accent-bazar-purple"
							/>
							{option.label}
						</label>
					{/each}
				</div>
			</div>

			<!-- Has apartment -->
			<div>
				<label class="flex items-center gap-3 cursor-pointer">
					<div class="relative">
						<input
							type="checkbox"
							class="sr-only peer"
							checked={hasApartment}
							onchange={() => (hasApartment = !hasApartment)}
						/>
						<div
							class="w-10 h-6 rounded-full transition-colors
								{hasApartment ? 'bg-bazar-purple' : 'bg-bazar-gray-200'}"
						></div>
						<div
							class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
								{hasApartment ? 'translate-x-4' : ''}"
						></div>
					</div>
					<span class="text-sm font-medium text-bazar-dark">Am deja un apartament</span>
				</label>
				<input type="hidden" name="has_apartment" value={hasApartment ? 'true' : 'false'} />

				{#if hasApartment}
					<div class="mt-3">
						<input
							name="apartment_link"
							type="url"
							value={data.roommatePrefs?.apartment_link ?? ''}
							placeholder="Link catre anunt (optional)"
							class="w-full px-3 py-2.5 text-sm border-2 border-bazar-gray-200 rounded-bazar-sm focus:outline-none focus:border-bazar-purple transition-colors"
						/>
					</div>
				{/if}
			</div>

			<button
				type="submit"
				class="w-full py-2.5 text-sm font-medium bg-bazar-dark text-white rounded-bazar-sm hover:opacity-90 transition-opacity"
			>
				Salveaza preferintele
			</button>
		</form>
	</div>

	<!-- Deactivate section -->
	<div class="bg-white rounded-bazar-lg border-2 border-bazar-gray-100 p-6">
		{#if !showDeactivateConfirm}
			<button
				type="button"
				onclick={() => (showDeactivateConfirm = true)}
				class="w-full py-2.5 text-sm font-medium bg-emerald-50 text-emerald-700 border-2 border-emerald-200 rounded-bazar-sm hover:bg-emerald-100 transition-colors"
			>
				Am gasit coleg de camera!
			</button>
		{:else}
			<div class="text-center">
				<p class="text-sm text-bazar-gray-700 mb-4">
					Esti sigur/a? Profilul tau va fi dezactivat si nu va mai aparea in listari.
				</p>
				<div class="flex gap-3">
					<button
						type="button"
						onclick={() => (showDeactivateConfirm = false)}
						class="flex-1 py-2.5 text-sm font-medium border-2 border-bazar-gray-200 text-bazar-dark rounded-bazar-sm hover:border-bazar-gray-300 transition-colors"
					>
						Anuleaza
					</button>
					<form method="POST" action="?/deactivate" use:enhance class="flex-1">
						<button
							type="submit"
							class="w-full py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-bazar-sm hover:opacity-90 transition-opacity"
						>
							Da, dezactiveaza
						</button>
					</form>
				</div>
			</div>
		{/if}
	</div>

	<!-- Sign out -->
	<form
		method="POST"
		action="?/signout"
		use:enhance={() => {
			return async () => {
				goto('/login');
			};
		}}
	>
		<button
			type="submit"
			class="w-full py-2.5 text-sm font-medium text-red-600 border-2 border-red-200 rounded-bazar-sm hover:bg-red-50 transition-colors"
		>
			Deconecteaza-te
		</button>
	</form>
</div>
