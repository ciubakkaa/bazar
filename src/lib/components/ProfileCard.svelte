<script lang="ts">
	import CompatibilityBadge from './CompatibilityBadge.svelte';

	type PersonData = {
		id: string;
		full_name: string;
		home_city: string | null;
		faculty: { short_name: string; university_id: string | null; university: { short_name: string } | null } | null;
		roommate_preferences: Record<string, unknown> | null;
		compatibility_score: number | null;
		quiz_answers?: Record<string, unknown> | null;
	};

	let { person }: { person: PersonData } = $props();

	const traits = $derived.by(() => {
		const t: { icon: string; label: string }[] = [];
		const q = person.quiz_answers;
		if (!q) return t;
		if (q.sleep_schedule !== null && q.sleep_schedule !== undefined) {
			t.push((q.sleep_schedule as number) <= 2 ? { icon: '🌙', label: 'Nocturn' } : { icon: '☀️', label: 'Matinal' });
		}
		if (q.noise_tolerance !== null && q.noise_tolerance !== undefined) {
			t.push((q.noise_tolerance as number) <= 2 ? { icon: '🔕', label: 'Liniste' } : { icon: '🎵', label: 'Zgomot ok' });
		}
		if (q.smoking !== null && q.smoking !== undefined) {
			t.push(q.smoking ? { icon: '🚬', label: 'Fumator' } : { icon: '🚭', label: 'Nefumator' });
		}
		if (q.pets !== null && q.pets !== undefined) {
			if (q.pets) t.push({ icon: '🐾', label: 'Animale ok' });
		}
		if (q.cleanliness !== null && q.cleanliness !== undefined) {
			if ((q.cleanliness as number) >= 4) t.push({ icon: '✨', label: 'Ordonat' });
		}
		return t;
	});

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<a
	href="/people/{person.id}"
	class="block bg-white rounded-bazar-xl hover:shadow-[0_8px_40px_rgba(44,47,48,0.06)] hover:-translate-y-0.5 transition-all p-4"
>
	<div class="flex items-start gap-3">
		<!-- Avatar -->
		<div
			class="w-11 h-11 rounded-full bg-gradient-to-br from-bazar-purple to-bazar-orange flex items-center justify-center text-white font-bold text-xs shrink-0"
		>
			{getInitials(person.full_name)}
		</div>

		<div class="min-w-0 flex-1">
			<!-- Name -->
			<div class="font-semibold text-bazar-dark truncate">{person.full_name}</div>

			<!-- Faculty & university -->
			{#if person.faculty}
				<div class="text-sm text-bazar-gray-500 truncate">
					{person.faculty.short_name}
					{#if person.faculty.university}
						&middot; {person.faculty.university.short_name}
					{/if}
				</div>
			{/if}

			<!-- Home city -->
			{#if person.home_city}
				<div class="text-xs text-bazar-gray-500">{person.home_city}</div>
			{/if}

			<!-- Badges row -->
			<div class="flex items-center gap-2 mt-2 flex-wrap">
				<CompatibilityBadge score={person.compatibility_score} />
				{#if person.roommate_preferences}
					<span class="bg-bazar-yellow/20 text-bazar-dark text-xs font-medium px-2 py-0.5 rounded-bazar-pill">
						Caută coleg
					</span>
				{/if}
			</div>

			<!-- Trait chips -->
			{#if traits.length > 0}
				<div class="flex items-center gap-1.5 mt-2 flex-wrap">
					{#each traits as trait}
						<span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-bazar-gray-100 text-bazar-gray-700">
							{trait.icon} {trait.label}
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</a>
