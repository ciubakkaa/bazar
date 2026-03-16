<script lang="ts">
  let { children } = $props();
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-bazar-offwhite px-4">
  <a href="/" class="font-heading font-bold text-2xl tracking-tight mb-8 text-bazar-dark no-underline">
    ba<span class="inline-block bg-bazar-yellow px-1.5 rounded-md -rotate-2">zar</span>
  </a>
  <div class="w-full max-w-md">
    {@render children()}
  </div>
</div>
