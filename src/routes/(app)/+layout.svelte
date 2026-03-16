<script lang="ts">
  import NavBar from '$lib/components/NavBar.svelte';

  let { data, children } = $props();
</script>

<!-- Mobile header -->
<div class="flex items-center justify-between px-5 py-4 bg-white border-b-2 border-bazar-gray-100 sticky top-0 z-40 md:hidden">
  <div class="font-heading font-bold text-[22px] tracking-tight text-bazar-dark">
    ba<span class="inline-block bg-bazar-yellow px-1 rounded-[4px] -rotate-2">zar</span>
  </div>
  <div class="w-8 h-8 rounded-[9px] bg-gradient-to-br from-bazar-purple to-bazar-orange flex items-center justify-center text-white font-bold text-xs">
    {data.profile?.full_name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) ?? '??'}
  </div>
</div>

<div class="md:flex min-h-screen bg-bazar-offwhite">
  <NavBar profile={data.profile} />
  <main class="flex-1 md:ml-[260px] pb-20 md:pb-0">
    {@render children()}
  </main>
</div>
