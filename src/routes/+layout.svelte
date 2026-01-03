<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { page } from '$app/state'; // Svelte 5 建議用法
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { theme, initTheme, toggleTheme as toggleThemeStore } from '$lib/stores/theme';
    import { fly, slide } from 'svelte/transition';

    let { children } = $props();
    let mobileOpen = $state(false);

    // 判斷是否為登入頁
    let isLoginPage = $derived(page.url.pathname === '/' || page.url.pathname.includes('login'));

    onMount(() => {
        initTheme();
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
        });
        return () => authListener?.subscription?.unsubscribe();
    });

    const navItems = [
        { name: '副本列表', href: '/parties', icon: '📋' },
        { name: '更改紀錄', href: '/changelog', icon: '📝' }
    ];
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen flex flex-col bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors duration-300">
    
    {#if !isLoginPage}
    <nav class="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                
                <div class="flex items-center">
                    <a href="/" class="flex items-center gap-2 group">
                        <span class="text-2xl group-hover:scale-110 transition-transform">🎮</span>
                        <span class="text-xl font-bold tracking-tight bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                            表單系統
                        </span>
                    </a>
                </div>

                <div class="hidden md:flex items-center gap-1">
                    {#each navItems as item}
                        <a href={item.href} 
                           class="px-4 py-2 rounded-lg text-sm font-medium transition-all
                                  {page.url.pathname === item.href 
                                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' 
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}">
                            {item.name}
                        </a>
                    {/each}

                    <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

                    <div class="flex items-center gap-2">
                        <button onclick={toggleThemeStore} 
                                class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-lg"
                                aria-label="切換主題">
                            {$theme ? '☀️' : '🌙'}
                        </button>
                        <a href="/profile" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors">
                            👤
                        </a>
                    </div>
                </div>

                <div class="md:hidden flex items-center gap-2">
                    <button onclick={toggleThemeStore} class="p-2 text-lg">{$theme ? '☀️' : '🌙'}</button>
                    <button class="p-2 text-slate-600 dark:text-slate-400" onclick={() => mobileOpen = !mobileOpen}>
                        <span class="text-2xl">{mobileOpen ? '✕' : '☰'}</span>
                    </button>
                </div>
            </div>
        </div>

        {#if mobileOpen}
            <div class="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]" transition:slide>
                <div class="px-4 pt-2 pb-6 space-y-1">
                    {#each navItems as item}
                        <a href={item.href} 
                           onclick={() => mobileOpen = false}
                           class="block px-4 py-3 rounded-xl text-base font-medium
                                  {page.url.pathname === item.href 
                                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                  : 'text-slate-600 dark:text-slate-400'}">
                            {item.icon} {item.name}
                        </a>
                    {/each}
                    <a href="/profile" class="block px-4 py-3 text-slate-600 dark:text-slate-400">👤 帳戶設定</a>
                </div>
            </div>
        {/if}
    </nav>
    {/if}

    <main class="grow {isLoginPage ? '' : 'max-w-8xl mx-auto px-4 pb-9'}">
        {@render children()}
    </main>

    {#if !isLoginPage}
    <footer class="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120]/50 py-8">
        <div class="max-w-7xl mx-auto px-4 text-center sm:flex sm:justify-between sm:text-left">
            <p class="text-sm text-slate-500 dark:text-slate-500">
                © 2026 LobbySync - 即時副本組隊系統
            </p>
            <div class="mt-4 sm:mt-0 flex justify-center gap-6 text-sm text-slate-400">
                <a href="https://github.com" class="hover:text-indigo-500 transition-colors">GitHub</a>
            </div>
        </div>
    </footer>
    {/if}
</div>

<style>
    /* 這裡可以放微調的 CSS，大部份已由 Tailwind 處理 */
    :global(html) {
        scroll-behavior: smooth;
    }
</style>