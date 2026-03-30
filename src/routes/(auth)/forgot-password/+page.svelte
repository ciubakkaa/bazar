<script lang="ts">
  import { createClient } from '$lib/supabase';

  const supabase = createClient();

  let email = $state('');
  let loading = $state(false);
  let error = $state('');
  let sent = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    });

    if (resetError) {
      error = resetError.message;
      loading = false;
      return;
    }

    sent = true;
    loading = false;
  }
</script>

<div class="bg-white rounded-bazar-lg p-5 md:p-8 text-center">
  {#if sent}
    <div class="text-4xl mb-4">📧</div>
    <h1 class="font-heading font-bold text-2xl mb-2">Verifica-ti emailul</h1>
    <p class="text-sm text-bazar-gray-500 mb-6">
      Ti-am trimis un link de resetare la <strong>{email}</strong>. Verifica inbox-ul (si spam-ul).
    </p>
    <a href="/login" class="text-sm text-bazar-dark font-semibold hover:underline">
      Inapoi la login
    </a>
  {:else}
    <h1 class="font-heading font-bold text-2xl mb-1">Ai uitat parola?</h1>
    <p class="text-sm text-bazar-gray-500 mb-6">Introdu emailul si iti trimitem un link de resetare.</p>

    {#if error}
      <div class="bg-red-50 text-red-700 text-sm rounded-bazar-sm px-4 py-3 mb-4 text-left">
        {error}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4 text-left">
      <div>
        <label for="email" class="block text-sm font-medium mb-1.5">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          required
          placeholder="boboc@email.com"
          class="w-full px-4 py-2.5 rounded-bazar-sm text-sm bg-bazar-gray-100 focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full bg-bazar-dark text-white font-semibold py-2.5 rounded-bazar-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Se trimite...' : 'Trimite link de resetare'}
      </button>
    </form>

    <p class="text-center text-sm text-bazar-gray-500 mt-6">
      Ti-ai amintit? <a href="/login" class="text-bazar-dark font-semibold hover:underline">Conecteaza-te</a>
    </p>
  {/if}
</div>
