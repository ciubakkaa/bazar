<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { createClient } from '$lib/supabase';

  const supabase = createClient();

  let email = $derived(page.url.searchParams.get('email') ?? '');
  let token = $state('');
  let loading = $state(false);
  let resending = $state(false);
  let error = $state('');
  let resendMessage = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!email) {
      error = 'Emailul lipseste. Te rugam sa te inregistrezi din nou.';
      return;
    }

    loading = true;
    error = '';

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });

    if (verifyError) {
      error = verifyError.message;
      loading = false;
      return;
    }

    goto('/setup-profile');
  }

  async function handleResend() {
    if (!email) {
      error = 'Emailul lipseste. Te rugam sa te inregistrezi din nou.';
      return;
    }

    resending = true;
    error = '';
    resendMessage = '';

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email
    });

    if (resendError) {
      error = resendError.message;
    } else {
      resendMessage = 'Codul a fost retrimis! Verifica inbox-ul.';
    }

    resending = false;
  }
</script>

<div class="bg-white rounded-bazar-lg border border-bazar-gray-100 p-5 md:p-8 text-center">
  <div class="text-4xl mb-4">📧</div>
  <h1 class="font-heading font-bold text-2xl mb-2">Verifica-ti emailul</h1>
  <p class="text-sm text-bazar-gray-500 mb-6">
    Ti-am trimis un cod de confirmare{email ? ` la ${email}` : ''}. Verifica inbox-ul (si spam-ul).
  </p>

  {#if error}
    <div class="bg-red-50 text-red-700 text-sm rounded-bazar-sm px-4 py-3 mb-4 text-left">
      {error}
    </div>
  {/if}

  {#if resendMessage}
    <div class="bg-green-50 text-green-700 text-sm rounded-bazar-sm px-4 py-3 mb-4">
      {resendMessage}
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <input
        type="text"
        bind:value={token}
        required
        maxlength={6}
        placeholder="000000"
        inputmode="numeric"
        autocomplete="one-time-code"
        class="w-full px-4 py-4 border border-bazar-gray-200 rounded-bazar-sm text-center text-2xl font-heading font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-bazar-yellow/50 focus:border-bazar-yellow transition-colors"
      />
    </div>

    <button
      type="submit"
      disabled={loading || token.length !== 6}
      class="w-full bg-bazar-dark text-white font-semibold py-2.5 rounded-bazar-sm hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? 'Se verifica...' : 'Confirma codul'}
    </button>
  </form>

  <button
    onclick={handleResend}
    disabled={resending}
    class="mt-4 text-sm text-bazar-gray-500 hover:text-bazar-dark font-medium transition-colors disabled:opacity-50"
  >
    {resending ? 'Se retrimite...' : 'Retrimite codul'}
  </button>
</div>
