<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import type { User } from '@supabase/supabase-js';

	let user = $state<User | null>(null);

	let loading = $state(true);

	onMount(async () => {
		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();
			if (session?.user) {
				user = session.user;

				// admin check removed; no admin badge
			}
		} catch (err) {
			console.warn('Failed to load session', err);
		} finally {
			loading = false;
		}
	});

	async function signOut() {
		await supabase.auth.signOut();
		location.href = '/';
	}
</script>

<svelte:head>
	<title>個人頁面</title>
</svelte:head>

<div class="mx-auto max-w-2xl p-6">
	<h1 class="mb-4 text-2xl font-bold">個人設定</h1>

	{#if loading}
		<p>載入中…</p>
	{:else if user}
		<div class="mb-4 rounded-lg border bg-white p-6 dark:bg-slate-900">
			<div class="flex items-center gap-4">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold dark:bg-slate-800"
				>
					{(user.email || user.id || '').charAt(0).toUpperCase()}
				</div>
				<div>
					<div class="text-lg font-semibold">{user.email ?? user.id}</div>
					<div class="text-sm text-slate-500">ID: {user.id}</div>
					<!-- 管理員標籤已移除 -->
				</div>
			</div>
		</div>

		<div class="flex gap-2">
			<button class="rounded bg-slate-200 px-4 py-2" onclick={() => (location.href = '/parties')}
				>返回團隊列表</button
			>
			<button class="rounded bg-red-600 px-4 py-2 text-white" onclick={signOut}>登出</button>
		</div>
	{:else}
		<div class="rounded border border-yellow-200 bg-yellow-50 p-4">
			未登入，請先登入以查看帳戶資訊。
		</div>
	{/if}
</div>

<!-- removed unused selector; Tailwind utility classes handle dark background -->
