<script lang="ts">
    import { fade, fly, slide, scale } from 'svelte/transition';
    import { cubicOut, elasticOut } from 'svelte/easing';
    import { onMount } from 'svelte';

    // --- 系統狀態 ---
    let nickname = '';
    let password = '';
    let isAdmin = false;
    let isLoading = false;
    let showPassword = false;
    
    // --- 驗證狀態 ---
    let isAuthorized = false; 
    let loginError = false;
    let errorMessage = '';

    // --- 視覺偏移與延遲 ---
    let mouseX = 0;
    let mouseY = 0;
    let latency = 0;

    $: intensity = nickname.length > 0 ? 'text-indigo-400 opacity-100' : 'text-slate-600 opacity-50';
    $: glowColor = isAdmin ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.3)';

    async function getLatency() {
        try {
            const start = performance.now();
            await fetch('/', { method: 'HEAD', cache: 'no-cache' });
            latency = Math.round(performance.now() - start) + Math.floor(Math.random() * 5);
        } catch { 
            latency = Math.floor(Math.random() * 10) + 15; 
        }
    }

    onMount(() => {
        getLatency();
        const interval = setInterval(getLatency, 4000);
        return () => clearInterval(interval);
    });

    async function handleAuth() {
        if (!nickname) return;
        isLoading = true;
        loginError = false;
        errorMessage = '';

        await new Promise(r => setTimeout(r, 1500));

        if (isAdmin) {
            if (password === 'admin888') {
                isAuthorized = true;
            } else {
                isLoading = false;
                loginError = true;
                errorMessage = 'SECURITY_BREACH: INVALID_ACCESS_KEY';
            }
        } else {
            isAuthorized = true;
        }
    }

    function handleMouseMove(e: MouseEvent) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 30;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 30;
    }
</script>

<div 
    on:mousemove={handleMouseMove}
    role="presentation"
    class="min-h-screen flex font-sans selection:bg-indigo-500 selection:text-white overflow-hidden bg-slate-950"
>
    {#if !isAuthorized}
        <div class="hidden lg:flex w-[55%] relative overflow-hidden bg-slate-900 text-white flex-col justify-between p-12 border-r border-white/5" out:fade>
            
            <div class="absolute inset-0 z-0 pointer-events-none">
                <div class="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,3px_100%]"></div>
                <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#6366f1 1px, transparent 1px); background-size: 40px 40px;"></div>
                <div class="absolute top-[-20%] right-[-10%] w-150 h-150 rounded-full blur-[120px] transition-colors duration-1000" style="background-color: {glowColor}"></div>
            </div>

            <div class="relative z-10 flex items-center space-x-4">
                <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                    <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div class="flex flex-col">
                    <span class="text-2xl font-black tracking-tighter italic bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400">少東家幫幫我</span>
                    <span class="text-[10px] text-indigo-400 font-mono tracking-[0.3em] uppercase">Tactical Hub v5.5</span>
                </div>
            </div>

            <div class="relative z-10 flex-1 flex items-center justify-center">
                <div 
                    class="relative w-full max-w-md {loginError ? 'animate-shake' : ''} transition-transform duration-300 ease-out" 
                    style="transform: rotateX({mouseY * -0.2}deg) rotateY({mouseX * 0.2}deg)"
                >
                    <div class="relative bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-10 rounded-3xl shadow-2xl">
                        <div class="flex justify-between items-start mb-10">
                            <p class="text-[10px] font-mono {loginError ? 'text-red-500' : intensity} tracking-widest uppercase">
                                {loginError ? 'ACCESS_DENIED' : (nickname ? `TARGET: ${nickname}` : 'WAITING_FOR_INPUT...')}
                            </p>
                            <div class="inline-flex items-center space-x-2 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
                                <span class="w-1.5 h-1.5 {loginError ? 'bg-red-500' : 'bg-indigo-400'} rounded-full {isLoading ? 'animate-ping' : ''}"></span>
                                <span class="text-[9px] text-indigo-300 font-mono uppercase tracking-widest">{isLoading ? 'Syncing' : 'Ready'}</span>
                            </div>
                        </div>
                        
                        {#if loginError}
                            <div in:fade class="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p class="text-red-400 font-mono text-xs text-center animate-pulse">{errorMessage}</p>
                            </div>
                        {:else}
                            <div class="grid grid-cols-6 gap-2 mb-8 items-end h-12">
                                {#each Array(6) as _, i}
                                    <div class="bg-indigo-500/30 rounded-t-sm" style="height: {Math.random() * 80 + 20}%; animation: loading-bars 2s infinite; animation-delay: {i * 0.2}s"></div>
                                {/each}
                            </div>
                        {/if}

                        <div class="flex items-end justify-between border-t border-white/5 pt-6">
                            <div>
                                <p class="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-mono">System Latency</p>
                                <p class="text-3xl font-bold text-white tabular-nums tracking-tight">
                                    {latency}<span class="text-xs font-light text-indigo-400 ml-1">ms</span>
                                </p>
                            </div>
                            <div class="text-right font-mono text-xs text-white">
                                {isAdmin ? 'S-CLASS AUTH' : 'GUEST_MODE'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="relative z-10">
                <p class="text-2xl font-light text-slate-100 italic serif">「勝負已在落筆前定格。」</p>
            </div>
        </div>

        <div class="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 relative bg-slate-950" out:fly={{ x: 100, duration: 800 }}>
            
            <div class="absolute pointer-events-none opacity-40 z-0 transition-transform duration-500" style="transform: translate({mouseX}px, {mouseY}px);">
                <div class="absolute -top-60 -right-60 w-125 h-125 bg-indigo-500/20 rounded-full blur-[120px]"></div>
                <div class="absolute -bottom-60 -left-60 w-100 h-100 bg-purple-500/20 rounded-full blur-[120px]"></div>
            </div>

            <div in:fly={{ y: 40, duration: 1200, easing: cubicOut }} class="w-full max-w-sm relative z-10">
                <div class="bg-slate-900/80 backdrop-blur-2xl border {loginError ? 'border-red-500/50' : 'border-white/10'} p-10 rounded-[3rem] shadow-2xl transition-colors duration-500">
                    
                    <div class="text-center mb-10">
                        <div class="inline-block px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-indigo-500 font-bold tracking-[0.3em] uppercase mb-4">Secure Access</div>
                        <h2 class="text-4xl font-light text-white">歡迎回來<span class="text-indigo-600">.</span></h2>
                    </div>

                    <div class="bg-slate-800/50 p-1.5 rounded-2xl mb-10 relative flex border border-slate-700/50">
                        <div class="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-700 rounded-xl shadow-lg transition-all duration-500" style="left: {isAdmin ? 'calc(50% + 3px)' : '3px'}"></div>
                        <button class="relative z-10 flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors { !isAdmin ? 'text-white' : 'text-slate-400' }" on:click={() => { isAdmin = false; loginError = false; }}>玩家</button>
                        <button class="relative z-10 flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors { isAdmin ? 'text-white' : 'text-slate-400' }" on:click={() => { isAdmin = true; loginError = false; }}>管理員</button>
                    </div>

                    <form on:submit|preventDefault={handleAuth} class="space-y-6">
                        <div class="relative group">
                            <input id="nickname" bind:value={nickname} required placeholder=" " class="peer w-full px-6 py-5 bg-slate-950/50 border {loginError ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl focus:border-indigo-500 outline-none text-white transition-all" />
                            <label for="nickname" class="absolute left-6 top-5 text-slate-500 transition-all peer-focus:-top-3 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-indigo-500 peer-focus:bg-slate-900 px-2 uppercase tracking-widest">暱稱 / IDENTITY</label>
                        </div>

                        {#if isAdmin}
                            <div transition:slide={{ duration: 400 }} class="relative group">
                                <input id="password" type={showPassword ? 'text' : 'password'} bind:value={password} required placeholder=" " class="peer w-full px-6 py-5 bg-slate-950/50 border {loginError ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl focus:border-indigo-500 outline-none text-white transition-all" />
                                <label for="password" class="absolute left-6 top-5 text-slate-500 transition-all peer-focus:-top-3 peer-focus:left-4 peer-focus:text-[10px] peer-focus:text-indigo-500 peer-focus:bg-slate-900 px-2 uppercase tracking-widest">密碼 / ACCESS_KEY</label>
                            </div>
                        {/if}

                        <button type="submit" disabled={isLoading || !nickname} class="w-full relative group overflow-hidden rounded-2xl p-px active:scale-[0.97] transition-all disabled:opacity-50">
                            <span class="absolute inset-0 bg-linear-to-r from-indigo-600 via-violet-500 to-indigo-600 bg-size-[200%_auto] animate-[gradient_3s_linear_infinite]"></span>
                            <div class="relative bg-slate-950 group-hover:bg-transparent transition-all rounded-[calc(1rem-1px)] py-5 flex items-center justify-center">
                                {#if isLoading}
                                    <span class="text-white font-bold tracking-[0.2em] text-sm animate-pulse">正在通訊...</span>
                                {:else}
                                    <span class="text-white font-bold tracking-[0.3em] text-sm uppercase">Initiate_Uplink</span>
                                {/if}
                            </div>
                        </button>
                    </form>
                </div>
            </div>
        </div>

    {:else}
        <div in:fade={{ duration: 1000 }} class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-center">
            <div in:scale={{ duration: 1000, easing: elasticOut }} class="space-y-8">
                <div class="w-24 h-24 bg-indigo-500/20 rounded-full border border-indigo-500/50 flex items-center justify-center mx-auto animate-pulse">
                    <svg class="w-12 h-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div class="space-y-2">
                    <h1 class="text-5xl font-black italic text-white tracking-widest">連結成功</h1>
                    <p class="text-indigo-400 font-mono tracking-[0.5em] uppercase">Welcome back, {nickname}</p>
                </div>
                <button on:click={() => isAuthorized = false} class="px-8 py-2 border border-white/10 rounded-full text-[10px] text-slate-500 hover:bg-white/5 transition-all uppercase tracking-widest">Disconnect</button>
            </div>
        </div>
    {/if}
</div>

<style>
    @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    @keyframes loading-bars {
        0%, 100% { transform: scaleY(0.5); opacity: 0.3; }
        50% { transform: scaleY(1.2); opacity: 1; }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-8px) rotate(-1deg); }
        75% { transform: translateX(8px) rotate(1deg); }
    }
    .animate-shake { animation: shake 0.2s ease-in-out 2; }

    .serif { font-family: "Noto Serif TC", serif; }
    :global(body) { background-color: #020617; margin: 0; cursor: crosshair; }
    :global(::-webkit-scrollbar) { display: none; }
</style>