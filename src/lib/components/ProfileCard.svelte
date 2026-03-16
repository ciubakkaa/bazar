<script lang="ts">
	import CompatibilityBadge from './CompatibilityBadge.svelte';

	type PersonData = {
		id: string;
		full_name: string;
		home_city: string | null;
		faculty: { short_name: string; university_id: string | null; university: { short_name: string } | null } | null;
		roommate_preferences: Record<string, unknown> | null;
		compatibility_score: number | null;
	};

	let { person }: { person: PersonData } = $props();

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
	class="block bg-white rounded-bazar-md border-2 border-bazar-gray-100 hover:border-bazar-gray-300 hover:shadow-md transition-all p-4"
>
	<div class="flex items-start gap-3">
		<!-- Avatar -->
		<div
			class="w-10 h-10 rounded-full bg-gradient-to-br from-bazar-purple to-bazar-orange flex items-center justify-center text-white font-bold text-xs shrink-0"
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
		</div>
	</div>
</a>
