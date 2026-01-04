<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state'; // Svelte 5 建議用法
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { supabase } from '$lib/supabaseClient';
	import { theme, initTheme, toggleTheme as toggleThemeStore } from '$lib/stores/theme';

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

<div
	class="flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-[#0B1120] dark:text-slate-100"
>
	{#if !isLoginPage}
		<nav
			class="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-[#0B1120]/80"
		>
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center">
						<a href="/" class="group flex items-center gap-2">
							<span class="text-2xl transition-transform group-hover:scale-110">🎮</span>
							<span
								class="bg-linear-to-r from-slate-900 to-slate-600 bg-clip-text text-xl font-bold tracking-tight text-transparent dark:from-white dark:to-slate-400"
							>
								表單系統
							</span>
						</a>
					</div>

					<div class="hidden items-center gap-1 md:flex">
						{#each navItems as item (item.href)}
							<a
								href={item.href}
								data-sveltekit-preload-data
								class="rounded-lg px-4 py-2 text-sm font-medium transition-all
                                  {page.url.pathname === item.href
									? 'bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
									: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'}"
							>
								{item.name}
							</a>
						{/each}

						<div class="mx-2 h-4 w-px bg-slate-200 dark:bg-slate-800"></div>

						<div class="flex items-center gap-2">
							<button
								onclick={toggleThemeStore}
								class="rounded-lg p-2 text-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
								aria-label="切換主題"
							>
								{$theme ? '☀️' : '🌙'}
							</button>
							<a
								href="/profile"
								class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 transition-colors hover:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
							>
								👤
							</a>
						</div>
					</div>

					<div class="flex items-center gap-2 md:hidden">
						<button onclick={toggleThemeStore} class="p-2 text-lg">{$theme ? '☀️' : '🌙'}</button>
						<button
							class="p-2 text-slate-600 dark:text-slate-400"
							onclick={() => (mobileOpen = !mobileOpen)}
						>
							<span class="text-2xl">{mobileOpen ? '✕' : '☰'}</span>
						</button>
					</div>
				</div>
			</div>

			{#if mobileOpen}
				<div
					class="border-t border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-[#0B1120]"
					transition:slide
				>
					<div class="space-y-1 px-4 pt-2 pb-6">
						{#each navItems as item (item.href)}
							<a
								href={item.href}
								onclick={() => (mobileOpen = false)}
								data-sveltekit-preload-data
								class="block rounded-xl px-4 py-3 text-base font-medium
                                  {page.url.pathname === item.href
									? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
									: 'text-slate-600 dark:text-slate-400'}"
							>
								{item.icon}
								{item.name}
							</a>
						{/each}
						<a
							href="/profile"
							data-sveltekit-preload-data
							class="block px-4 py-3 text-slate-600 dark:text-slate-400">👤 帳戶設定</a
						>
					</div>
				</div>
			{/if}
		</nav>
	{/if}

	<main class="grow {isLoginPage ? '' : 'max-w-8xl mx-auto px-4 pb-9'}">
		{@render children()}
	</main>

	{#if !isLoginPage}
		<footer
			class="border-t border-slate-200 bg-slate-50 py-8 dark:border-slate-800 dark:bg-[#0B1120]/50"
		>
			<div class="mx-auto max-w-7xl px-4 text-center sm:flex sm:justify-between sm:text-left">
				<p class="text-sm text-slate-500 dark:text-slate-500">
					© 2026 LobbySync - 即時副本組隊系統
				</p>
				<div class="mt-4 flex justify-center gap-6 text-sm text-slate-400 sm:mt-0">
					<a href="https://github.com" class="transition-colors hover:text-indigo-500">GitHub</a>
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
