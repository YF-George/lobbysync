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
    const Icons = {
        Arrow: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>`
    };

    async function handleAuth() {
        // 匿名登入流程，若提供暱稱會嘗試寫入使用者 metadata
        isLoading = true; error = ''; successMessage = '';
        try {
            const { data, error: authError } = await supabase.auth.signInAnonymously();
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

            setTimeout(() => goto('/parties'), 500);
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

<div class="min-h-screen flex bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-black dark:selection:bg-slate-700 selection:text-white">
    
    <div class="hidden lg:flex lg:w-1/2 bg-slate-50 dark:bg-slate-800 relative overflow-hidden border-r border-slate-200 dark:border-slate-700 flex-col justify-between p-12">
        <div class="absolute inset-0 opacity-[0.4]" 
             style="background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 24px 24px;">
        </div>
        
            <div class="relative z-10 flex items-center gap-3">
                <div class="h-10 w-10 bg-linear-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30" aria-label="LobbySync 標誌">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2">
                        <title>LobbySync</title>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 2l7 4v6c0 5-3.8 9.7-7 10-3.2-.3-7-5-7-10V6l7-4z" />
                        <circle cx="12" cy="11" r="2" fill="currentColor" />
                    </svg>
                </div>
                <div>
                    <h2 class="text-2xl font-bold tracking-tight m-0 text-slate-900 dark:text-slate-100">LobbySync</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">團隊管理系統</p>
                </div>
            </div>

        <div class="relative z-10 w-full max-w-sm mx-auto">
                <div class="bg-white dark:bg-slate-700 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 -rotate-2 transition-transform hover:rotate-0 duration-500">
                <div class="flex gap-2 mb-4">
                    <div class="w-3 h-3 rounded-full bg-red-400"></div>
                    <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div class="space-y-3">
                    <div class="h-2 bg-slate-100 rounded w-3/4"></div>
                    <div class="h-2 bg-slate-100 rounded w-1/2"></div>
                    <div class="h-2 bg-slate-100 rounded w-full"></div>
                    <div class="flex gap-2 mt-4">
                        <div class="h-8 w-8 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-100"></div>
                        <div class="h-8 w-8 rounded-full bg-purple-500 border-2 border-white -ml-4"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="relative z-10">
            <blockquote class="relative">
                <span class="absolute -top-8 -left-4 text-6xl text-slate-200 font-serif select-none">“</span>
                
                <p class="text-2xl font-bold text-slate-400 dark:text-slate-300 leading-tight tracking-tight">
                    讓靈感不再孤獨
                </p>
                <p class="mt-3 text-lg font-medium text-slate-400 dark:text-slate-300">
                    在共鳴中預見未來
                </p>
            </blockquote>
        </div>
    </div>

    <div class="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 relative bg-white dark:bg-slate-900">
        <button aria-label="切換深色模式" class="absolute top-6 right-6 z-20 p-2 rounded-md bg-slate-100/70 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700" onclick={toggleTheme}>
            {#if $theme}
                🌙
            {:else}
                ☀️
            {/if}
        </button>

        <div class="w-full max-w-sm">
            <div class="p-8 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/10 dark:shadow-none">
                <div class="text-center lg:text-left space-y-3">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800">
                        <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span class="text-xs font-semibold text-indigo-700 dark:text-indigo-300">線上服務</span>
                    </div>
                    <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">歡迎回來</h1>
                    <p class="text-base text-slate-600 dark:text-slate-400">輸入暱稱開始管理你的團隊</p>
                </div>

                <div class="mt-4 space-y-5">
                    <!-- Google sign-in removed per request -->

                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label for="nickname" class="block text-sm font-bold text-slate-700 dark:text-slate-300">暱稱 <span class="text-red-500">*</span></label>
                            <input
                                id="nickname" type="text" bind:value={nickname} required
                                class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                placeholder="例如：千羽夜"
                            />
                        </div>

                        {#if isAdmin}
                        <div class="space-y-1">
                            <label for="adminPassword" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">管理員密碼</label>
                            <input
                                id="adminPassword" type="password" bind:value={adminPassword}
                                class="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:border-slate-200 focus:border-slate-900 transition-all"
                                placeholder="管理員密碼"
                            />
                        </div>
                        {/if}
                    </div>

                    {#if error}
                        <div in:fly={{ y: -10 }} class="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-lg flex items-center gap-2">
                            <span class="w-1 h-4 bg-red-500 rounded-full"></span> {error}
                        </div>
                    {/if}

                    {#if successMessage}
                        <div in:fly={{ y: -10 }} class="p-3 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 rounded-lg flex items-center gap-2">
                            <span class="w-1 h-4 bg-emerald-500 rounded-full"></span> {successMessage}
                        </div>
                    {/if}

                    <button 
                        onclick={handleAuth}
                        disabled={isLoading}
                        class="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-500/30 active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {#if isLoading}
                            <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {:else}
                            <span>進入</span>
                            <span class="group-hover:translate-x-1 transition-transform">{@html Icons.Arrow}</span>
                        {/if}
                    </button>

                    <p class="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">
                        <button
                            class="text-slate-900 dark:text-slate-100 font-semibold hover:underline"
                            onclick={() => { isAdmin = !isAdmin; adminPassword = ''; error = ''; successMessage = ''; }}
                        >
                            {isAdmin ? '←普通玩家' : '管理員→'}
                        </button>
                    </p>
                </div>
            </div>
        </div>

        <div class="absolute bottom-6 text-[11px] font-medium tracking-wider uppercase text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} 千羽夜. Privacy & Terms
        </div>
    </div>
</div>