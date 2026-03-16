<script lang="ts">
  import { page } from '$app/state';
  import type { Profile } from '$lib/types';

  let { profile }: { profile: Profile & { faculty?: { short_name: string } | null } } = $props();

  const links = [
    { href: '/checklist', label: 'Checklist', icon: '📋' },
    { href: '/people', label: 'Oameni', icon: '👥' },
    { href: '/messages', label: 'Mesaje', icon: '💬' },
    { href: '/qa', label: 'Întrebări', icon: '❓' },
    { href: '/profile', label: 'Profil', icon: '👤' },
  ];

  function isActive(href: string) {
    return page.url.pathname.startsWith(href);
  }

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<!-- Desktop sidebar -->
<nav class="hidden md:flex fixed top-0 left-0 w-[260px] h-screen flex-col bg-white border-r border-bazar-gray-100 z-50">
  <!-- Logo -->
  <div class="px-6 py-6">
    <div class="font-heading font-bold text-[22px] tracking-tight text-bazar-dark">
      ba<span class="inline-block bg-bazar-yellow px-1 rounded-[4px] -rotate-2">zar</span>
    </div>
  </div>

  <!-- Nav links -->
  <div class="flex flex-col gap-1 px-3 mt-2">
    {#each links as link}
      <a
        href={link.href}
        class="flex items-center gap-3 px-3 py-2.5 rounded-bazar-sm text-[15px] font-medium transition-colors
          {isActive(link.href)
            ? 'bg-bazar-dark text-white'
            : 'text-bazar-gray-500 hover:bg-bazar-gray-100'}"
      >
        <span class="text-[18px]">{link.icon}</span>
        {link.label}
      </a>
    {/each}
  </div>

  <!-- User profile section -->
  <div class="mt-auto px-4 py-4 border-t border-bazar-gray-100">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-[9px] bg-gradient-to-br from-bazar-purple to-bazar-orange flex items-center justify-center text-white font-bold text-xs shrink-0">
        {profile?.full_name ? getInitials(profile.full_name) : '??'}
      </div>
      <div class="min-w-0">
        <div class="text-sm font-semibold text-bazar-dark truncate">
          {profile?.full_name ?? 'Utilizator'}
        </div>
        {#if profile?.faculty?.short_name}
          <div class="text-xs text-bazar-gray-500 truncate flex items-center gap-1">
            {profile.faculty.short_name}
            {#if profile.is_verified}
              <span class="text-bazar-green text-[10px]">&#10003;</span>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</nav>

<!-- Mobile bottom tab bar -->
<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-bazar-gray-100 z-50 pb-[env(safe-area-inset-bottom)]">
  <div class="flex items-center justify-around px-2 pt-2 pb-1">
    {#each links as link}
      <a
        href={link.href}
        class="flex flex-col items-center gap-0.5 min-w-0 px-1 py-1 transition-colors
          {isActive(link.href) ? 'text-bazar-dark' : 'text-bazar-gray-500'}"
      >
        <span class="text-[22px] leading-none">{link.icon}</span>
        <span class="text-[10px] font-medium leading-tight">{link.label}</span>
      </a>
    {/each}
  </div>
</nav>
