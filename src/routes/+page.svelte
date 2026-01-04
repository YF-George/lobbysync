<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { theme, initTheme, toggleTheme } from '$lib/stores/theme';
	let nickname = $state('');
	let adminPassword = $state('');
	let isAdmin = $state(false);
	let isLoading = $state(false);
	let error = $state('');
	let successMessage = $state('');
	// 使用共用主題 store

	// 圖標：僅保留箭頭
	const _Icons = {
		Arrow: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>`
	};

	async function handleAuth() {
		// 匿名登入流程，若提供暱稱會嘗試寫入使用者 metadata
		isLoading = true;
		error = '';
		successMessage = '';
		try {
			const { data: _data, error: authError } = await supabase.auth.signInAnonymously();
			if (authError) throw authError;

			if (nickname) {
				try {
					await supabase.auth.updateUser({ data: { nickname } });
				} catch (uErr) {
					console.warn('updateUser failed', uErr);
				}
			}

			if (adminPassword) {
				successMessage = '已提交管理員密碼（尚未驗證）';
			} else {
				successMessage = '登入成功（匿名）';
			}

			setTimeout(() => goto('/parties', { replaceState: true }), 500);
		} catch (err) {
			error = err instanceof Error ? err.message : '驗證失敗';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		initTheme();
	});
</script>

<div
	class="flex min-h-screen bg-white font-sans text-slate-900 selection:bg-black selection:text-white dark:bg-slate-900 dark:text-slate-100 dark:selection:bg-slate-700"
>
	<div
		class="relative hidden flex-col justify-between overflow-hidden border-r border-slate-200 bg-slate-50 p-12 lg:flex lg:w-1/2 dark:border-slate-700 dark:bg-slate-800"
	>
		<div
			class="absolute inset-0 opacity-[0.4]"
			style="background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 24px 24px;"
		></div>

		<div class="relative z-10 flex items-center gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/30"
				aria-label="LobbySync 標誌"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					class="h-6 w-6"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<title>LobbySync</title>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 2l7 4v6c0 5-3.8 9.7-7 10-3.2-.3-7-5-7-10V6l7-4z"
					/>
					<circle cx="12" cy="11" r="2" fill="currentColor" />
				</svg>
			</div>
			<div>
				<h2 class="m-0 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
					LobbySync
				</h2>
				<p class="text-xs font-medium text-slate-500 dark:text-slate-400">團隊管理系統</p>
			</div>
		</div>

		<div class="relative z-10 mx-auto w-full max-w-sm">
			<div
				class="-rotate-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xl transition-transform duration-500 hover:rotate-0 dark:border-slate-700 dark:bg-slate-700"
			>
				<div class="mb-4 flex gap-2">
					<div class="h-3 w-3 rounded-full bg-red-400"></div>
					<div class="h-3 w-3 rounded-full bg-amber-400"></div>
					<div class="h-3 w-3 rounded-full bg-emerald-400"></div>
				</div>
				<div class="space-y-3">
					<div class="h-2 w-3/4 rounded bg-slate-100"></div>
					<div class="h-2 w-1/2 rounded bg-slate-100"></div>
					<div class="h-2 w-full rounded bg-slate-100"></div>
					<div class="mt-4 flex gap-2">
						<div
							class="h-8 w-8 rounded-full border-2 border-white bg-blue-500 ring-2 ring-blue-100"
						></div>
						<div class="-ml-4 h-8 w-8 rounded-full border-2 border-white bg-purple-500"></div>
					</div>
				</div>
			</div>
		</div>

		<div class="relative z-10">
			<blockquote class="relative">
				<span class="absolute -top-8 -left-4 font-serif text-6xl text-slate-200 select-none">“</span
				>

				<p
					class="text-2xl leading-tight font-bold tracking-tight text-slate-400 dark:text-slate-300"
				>
					讓靈感不再孤獨
				</p>
				<p class="mt-3 text-lg font-medium text-slate-400 dark:text-slate-300">在共鳴中預見未來</p>
			</blockquote>
		</div>
	</div>

	<div
		class="relative flex w-full flex-col items-center justify-center bg-white p-8 lg:w-1/2 lg:p-24 dark:bg-slate-900"
	>
		<button
			aria-label="切換深色模式"
			class="absolute top-6 right-6 z-20 rounded-md bg-slate-100/70 p-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
			onclick={toggleTheme}
		>
			{#if $theme}
				🌙
			{:else}
				☀️
			{/if}
		</button>

		<div class="w-full max-w-sm">
			<div
				class="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none"
			>
				<div class="space-y-3 text-center lg:text-left">
					<div
						class="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 dark:border-indigo-800 dark:bg-indigo-900/30"
					>
						<div class="h-2 w-2 animate-pulse rounded-full bg-indigo-500"></div>
						<span class="text-xs font-semibold text-indigo-700 dark:text-indigo-300">線上服務</span>
					</div>
					<h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
						歡迎回來
					</h1>
					<p class="text-base text-slate-600 dark:text-slate-400">輸入暱稱開始管理你的團隊</p>
				</div>

				<div class="mt-4 space-y-5">
					<!-- Google sign-in removed per request -->

					<div class="space-y-4">
						<div class="space-y-2">
							<label
								for="nickname"
								class="block text-sm font-bold text-slate-700 dark:text-slate-300"
								>暱稱 <span class="text-red-500">*</span></label
							>
							<input
								id="nickname"
								type="text"
								bind:value={nickname}
								required
								class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
								placeholder="例如：千羽夜"
							/>
						</div>

						{#if isAdmin}
							<div class="space-y-1">
								<label
									for="adminPassword"
									class="block text-sm font-semibold text-slate-700 dark:text-slate-300"
									>管理員密碼</label
								>
								<input
									id="adminPassword"
									type="password"
									bind:value={adminPassword}
									class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 transition-all focus:border-slate-900 focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-slate-200"
									placeholder="管理員密碼"
								/>
							</div>
						{/if}
					</div>

					{#if error}
						<div
							in:fly={{ y: -10 }}
							class="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20"
						>
							<span class="h-4 w-1 rounded-full bg-red-500"></span>
							{error}
						</div>
					{/if}

					{#if successMessage}
						<div
							in:fly={{ y: -10 }}
							class="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-900/10"
						>
							<span class="h-4 w-1 rounded-full bg-emerald-500"></span>
							{successMessage}
						</div>
					{/if}

					<button
						onclick={handleAuth}
						disabled={isLoading}
						class="group flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 py-4 font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:from-indigo-700 hover:to-purple-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isLoading}
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
							></div>
						{:else}
							<span>進入</span>
							<span class="transition-transform group-hover:translate-x-1">→</span>
						{/if}
					</button>

					<p class="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
						<button
							class="font-semibold text-slate-900 hover:underline dark:text-slate-100"
							onclick={() => {
								isAdmin = !isAdmin;
								adminPassword = '';
								error = '';
								successMessage = '';
							}}
						>
							{isAdmin ? '←普通玩家' : '管理員→'}
						</button>
					</p>
				</div>
			</div>
		</div>

		<div
			class="absolute bottom-6 text-[11px] font-medium tracking-wider text-slate-400 uppercase dark:text-slate-500"
		>
			&copy; {new Date().getFullYear()} 千羽夜. Privacy & Terms
		</div>
	</div>
</div>
