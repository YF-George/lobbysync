<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let user = $state<any>(null);
  let isAdmin = $state(false);
  let loading = $state(true);

  onMount(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        user = session.user;

        // 檢查是否為 admin（optional）
        try {
          const res = await fetch('/api/check-admin', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const info = await res.json();
            isAdmin = !!info.is_admin;
          }
        } catch (e) {
          // ignore
        }
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

<div class="max-w-2xl mx-auto p-6">
  <h1 class="text-2xl font-bold mb-4">個人設定</h1>

  {#if loading}
    <p>載入中…</p>
  {:else}
    {#if user}
      <div class="bg-white dark:bg-slate-900 border rounded-lg p-6 mb-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold">{(user.email || user.id || '').charAt(0).toUpperCase()}</div>
          <div>
            <div class="text-lg font-semibold">{user.email ?? user.id}</div>
            <div class="text-sm text-slate-500">ID: {user.id}</div>
            {#if isAdmin}
              <div class="mt-2 inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">管理員</div>
            {/if}
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <button class="px-4 py-2 bg-slate-200 rounded" onclick={() => location.href = '/parties'}>返回團隊列表</button>
        <button class="px-4 py-2 bg-red-600 text-white rounded" onclick={signOut}>登出</button>
      </div>
    {:else}
      <div class="bg-yellow-50 border border-yellow-200 rounded p-4">未登入，請先登入以查看帳戶資訊。</div>
    {/if}
  {/if}
</div>

<!-- removed unused selector; Tailwind utility classes handle dark background -->
