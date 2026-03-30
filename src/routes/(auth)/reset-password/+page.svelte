<script lang="ts">
  import { goto } from '$app/navigation';
  import { createClient } from '$lib/supabase';

  const supabase = createClient();

  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let error = $state('');
  let success = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (password.length < 6) {
      error = 'Parola trebuie sa aiba cel putin 6 caractere.';
      return;
    }

    if (password !== confirmPassword) {
      error = 'Parolele nu coincid.';
      return;
    }

    loading = true;
    error = '';

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      error = updateError.message;
      loading = false;
      return;
    }

    success = true;
    loading = false;

    setTimeout(() => goto('/checklist'), 2000);
  }
</script>

<div class="bg-white rounded-bazar-lg p-5 md:p-8">
  {#if success}
    <div class="text-center">
      <div class="text-4xl mb-4">✅</div>
      <h1 class="font-heading font-bold text-2xl mb-2">Parola a fost schimbata!</h1>
      <p class="text-sm text-bazar-gray-500">Vei fi redirectionat in cateva secunde...</p>
    </div>
  {:else}
    <h1 class="font-heading font-bold text-2xl mb-1 text-center">Seteaza parola noua</h1>
    <p class="text-sm text-bazar-gray-500 text-center mb-6">Alege o parola noua pentru contul tau.</p>

    {#if error}
      <div class="bg-red-50 text-red-700 text-sm rounded-bazar-sm px-4 py-3 mb-4">
        {error}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4">
      <div>
        <label for="password" class="block text-sm font-medium mb-1.5">Parola noua</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          minlength={6}
          placeholder="Minim 6 caractere"
          class="w-full px-4 py-2.5 rounded-bazar-sm text-sm bg-bazar-gray-100 focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 transition-colors"
        />
      </div>

      <div>
        <label for="confirm-password" class="block text-sm font-medium mb-1.5">Confirma parola</label>
        <input
          id="confirm-password"
          type="password"
          bind:value={confirmPassword}
          required
          minlength={6}
          placeholder="Reintrodu parola"
          class="w-full px-4 py-2.5 rounded-bazar-sm text-sm bg-bazar-gray-100 focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full bg-bazar-dark text-white font-semibold py-2.5 rounded-bazar-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Se salveaza...' : 'Schimba parola'}
      </button>
    </form>
  {/if}
</div>
