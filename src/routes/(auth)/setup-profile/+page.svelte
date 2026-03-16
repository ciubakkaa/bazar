<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  let step = $state(1);
  let fullName = $state('');
  let selectedUniversityId = $state('');
  let selectedFacultyId = $state('');
  let homeCity = $state('');
  let inviteCode = $state('');
  let showInviteCode = $state(false);
  let submitting = $state(false);

  const selectedUniversity = $derived(
    data.universities.find((u: any) => u.id === selectedUniversityId)
  );

  const faculties = $derived(selectedUniversity?.faculties ?? []);

  function nextStep() {
    step++;
  }

  function prevStep() {
    step--;
  }

  function selectUniversity(id: string) {
    selectedUniversityId = id;
    selectedFacultyId = '';
    nextStep();
  }

  function selectFaculty(id: string) {
    selectedFacultyId = id;
    nextStep();
  }
</script>

<!-- Progress dots -->
<div class="flex justify-center gap-2 mb-8">
  {#each [1, 2, 3, 4] as dot}
    <div
      class="w-2.5 h-2.5 rounded-full transition-colors duration-300 {step === dot
        ? 'bg-bazar-dark'
        : step > dot
          ? 'bg-bazar-yellow'
          : 'bg-bazar-gray-200'}"
    ></div>
  {/each}
</div>

<div class="bg-white rounded-bazar-lg border border-bazar-gray-100 p-8">
  {#if form?.error}
    <div class="bg-red-50 text-red-700 text-sm rounded-bazar-sm px-4 py-3 mb-4">
      {form.error}
    </div>
  {/if}

  <!-- Step 1: Full name -->
  {#if step === 1}
    <h1 class="font-heading font-bold text-2xl mb-1 text-center">Cum te cheama?</h1>
    <p class="text-sm text-bazar-gray-500 text-center mb-6">Numele tau complet, asa cum apare oficial.</p>

    <div class="space-y-4">
      <div>
        <label for="full_name" class="block text-sm font-medium mb-1.5">Nume complet</label>
        <input
          id="full_name"
          type="text"
          bind:value={fullName}
          required
          placeholder="Ion Popescu"
          class="w-full px-4 py-2.5 border border-bazar-gray-200 rounded-bazar-sm text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 focus:border-bazar-yellow transition-colors"
        />
      </div>

      <button
        type="button"
        onclick={nextStep}
        disabled={!fullName.trim()}
        class="w-full bg-bazar-dark text-white font-semibold py-2.5 rounded-bazar-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Continua
      </button>
    </div>

  <!-- Step 2: University selection -->
  {:else if step === 2}
    <h1 class="font-heading font-bold text-2xl mb-1 text-center">La ce universitate esti?</h1>
    <p class="text-sm text-bazar-gray-500 text-center mb-6">Selecteaza universitatea ta.</p>

    <div class="grid gap-3">
      {#each data.universities as university (university.id)}
        <button
          type="button"
          onclick={() => selectUniversity(university.id)}
          class="w-full text-left p-4 border-2 rounded-bazar-md transition-colors hover:border-bazar-yellow hover:bg-yellow-50 {selectedUniversityId === university.id
            ? 'border-bazar-yellow bg-yellow-50'
            : 'border-bazar-gray-100 bg-white'}"
        >
          <span class="font-semibold text-bazar-dark block">{university.short_name}</span>
          <span class="text-sm text-bazar-gray-500">{university.name}</span>
        </button>
      {/each}
    </div>

    <button
      type="button"
      onclick={prevStep}
      class="w-full mt-4 border border-bazar-gray-200 text-bazar-dark font-semibold py-2.5 rounded-bazar-sm hover:bg-bazar-gray-100 transition-colors"
    >
      Inapoi
    </button>

  <!-- Step 3: Faculty selection -->
  {:else if step === 3}
    <h1 class="font-heading font-bold text-2xl mb-1 text-center">Facultatea ta:</h1>
    <p class="text-sm text-bazar-gray-500 text-center mb-6">
      {selectedUniversity?.short_name} - alege facultatea.
    </p>

    <div class="grid gap-3 max-h-80 overflow-y-auto">
      {#each faculties as faculty (faculty.id)}
        <button
          type="button"
          onclick={() => selectFaculty(faculty.id)}
          class="w-full text-left p-4 border-2 rounded-bazar-md transition-colors hover:border-bazar-yellow hover:bg-yellow-50 {selectedFacultyId === faculty.id
            ? 'border-bazar-yellow bg-yellow-50'
            : 'border-bazar-gray-100 bg-white'}"
        >
          <span class="font-semibold text-bazar-dark block">{faculty.short_name}</span>
          <span class="text-sm text-bazar-gray-500">{faculty.name}</span>
        </button>
      {/each}
    </div>

    <button
      type="button"
      onclick={prevStep}
      class="w-full mt-4 border border-bazar-gray-200 text-bazar-dark font-semibold py-2.5 rounded-bazar-sm hover:bg-bazar-gray-100 transition-colors"
    >
      Inapoi
    </button>

  <!-- Step 4: Home city + Invite code + Submit -->
  {:else if step === 4}
    <h1 class="font-heading font-bold text-2xl mb-1 text-center">De unde esti?</h1>
    <p class="text-sm text-bazar-gray-500 text-center mb-6">Optional, dar te ajuta sa gasesti colegi din orasul tau.</p>

    <form
      method="POST"
      use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          submitting = false;
          await update();
        };
      }}
      class="space-y-4"
    >
      <input type="hidden" name="full_name" value={fullName} />
      <input type="hidden" name="faculty_id" value={selectedFacultyId} />

      <div>
        <label for="home_city" class="block text-sm font-medium mb-1.5">Oras de provenienta</label>
        <input
          id="home_city"
          type="text"
          name="home_city"
          bind:value={homeCity}
          placeholder="ex. Cluj-Napoca"
          class="w-full px-4 py-2.5 border border-bazar-gray-200 rounded-bazar-sm text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 focus:border-bazar-yellow transition-colors"
        />
      </div>

      <!-- Collapsible invite code section -->
      <div>
        <button
          type="button"
          onclick={() => (showInviteCode = !showInviteCode)}
          class="flex items-center gap-2 text-sm text-bazar-gray-500 hover:text-bazar-dark transition-colors"
        >
          <svg
            class="w-4 h-4 transition-transform duration-200 {showInviteCode ? 'rotate-90' : ''}"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Ai un cod de invitatie?
        </button>

        {#if showInviteCode}
          <div class="mt-3">
            <input
              type="text"
              name="invite_code"
              bind:value={inviteCode}
              placeholder="Introdu codul"
              class="w-full px-4 py-2.5 border border-bazar-gray-200 rounded-bazar-sm text-sm focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 focus:border-bazar-yellow transition-colors"
            />
          </div>
        {/if}
      </div>

      <button
        type="submit"
        disabled={submitting}
        class="w-full bg-bazar-dark text-white font-semibold py-2.5 rounded-bazar-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? 'Se salveaza...' : 'Finalizeaza'}
      </button>
    </form>

    <button
      type="button"
      onclick={prevStep}
      class="w-full mt-3 border border-bazar-gray-200 text-bazar-dark font-semibold py-2.5 rounded-bazar-sm hover:bg-bazar-gray-100 transition-colors"
    >
      Inapoi
    </button>
  {/if}
</div>
