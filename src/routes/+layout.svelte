<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { createClient } from '$lib/supabase';
  import '../app.css';

  let { data, children } = $props();

  const supabase = createClient();

  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      invalidate('supabase:auth');
    });

    return () => subscription.unsubscribe();
  });
</script>

{@render children()}
