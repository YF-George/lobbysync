<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import type { PageData } from './$types';
    import { supabase } from '$lib/supabaseClient';
    import { subscribeToPartyUpdates } from '$lib/realtime';

    let { data } = $props<{ data: PageData }>();

    // --- 狀態管理 (Svelte 5 Runes) ---
    let party = $state<any>(null);
    let slots = $state<any[]>([]);
    let authToken = $state('');
    let isAuthenticated = $state(false);
    let activeTab = $state<'members' | 'history'>('members');
    let changeLogs = $state<any[]>([]);
    let unsubscribe: (() => void) | null = null;

    const positionConfig: Record<string, { label: string, bg: string; border: string; text: string }> = {
        tank: { label: '坦克', bg: 'bg-[#78541a]', border: 'border-amber-600/50', text: 'text-amber-100' },
        heal: { label: '補師', bg: 'bg-[#1a5d3a]', border: 'border-emerald-600/50', text: 'text-emerald-100' },
        dps: { label: '輸出', bg: 'bg-[#6d1a24]', border: 'border-rose-600/50', text: 'text-rose-100' }
    };

    $effect(() => {
        party = data.party;
        slots = data.slots || [];
    });

    onMount(async () => {
        const { data: authData } = await supabase.auth.signInAnonymously();
        if (authData?.session) {
            authToken = authData.session.access_token;
            isAuthenticated = true;
        }
        loadChangeLogs();
        unsubscribe = subscribeToPartyUpdates(
            party.id,
            (updatedSlot) => {
            const index = slots.findIndex((s) => s.id === updatedSlot.id);
            if (index !== -1) {
                // 合併更新，保留本地樂觀更新
                slots[index] = { ...slots[index], ...updatedSlot };
            }
            },
            (updatedParty) => {
                // 即時同步 party 更新（包括等級等欄位）
                party = { ...party, ...updatedParty };
            }
        );
    });

    onDestroy(() => unsubscribe?.());

    async function updateSlot(slotId: string, changes: any) {
        if (!isAuthenticated) return;
        const index = slots.findIndex(s => s.id === slotId);
        if (index === -1) return;
        const oldSlot = { ...slots[index] };
        slots[index] = { ...oldSlot, ...changes };
        try {
            const res = await fetch(`/api/slot/${slotId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(changes)
            });
            if (res.ok) {
                const data = await res.json();
                // 如果後端回傳 slot，使用回傳的完整資料更新本地狀態
                if (data && data.slot) slots[index] = data.slot;
            } else {
                // 回滾
                slots[index] = oldSlot;
            }
        } catch (err) {
            slots[index] = oldSlot;
        }
    }

    async function updateParty(changes: any) {
        if (!isAuthenticated) return;
        if (!party?.id) return;
        const old = { ...party };
        party = { ...party, ...changes };
        try {
            const res = await fetch(`/api/party/${party.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(changes)
            });
            if (res.ok) {
                const data = await res.json();
                // 使用後端回傳的 party（若有）來同步本地狀態
                if (data && data.party) {
                    party = data.party;
                }
            } else {
                party = old;
            }
        } catch (err) {
            party = old;
        }
    }

    async function loadChangeLogs() {
        if (!party?.id) return;
        const res = await fetch(`/api/changelog/${party.id}`);
        if (res.ok) {
            const data = await res.json();
            changeLogs = data.logs || [];
        }
    }
</script>

<div class="bg-linear-to-br text-slate-100 font-sans">
    <header class="max-w-350 sticky top-0 z-30 shadow-lg">
        <div class="max-w-350 px-6 py-5 flex justify-between items-center">
            <div class="flex items-center gap-4">
                <a href="/parties" class="p-2 rounded-lg transition-colors" aria-label="返回列表">
                    <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </a>
                <div>
                    <h1 class="text-2xl font-black text-white">{party?.name || '團隊管理'}</h1>
                </div>
            </div>
            <!-- 已移除右側的編制顯示（party current/max players） -->
        </div>
    </header>

    <main class="max-w-350 mx-auto px-6">
            <!-- 團隊設定表單 -->
            <div class="mb-6 bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex flex-row flex-wrap items-end gap-4">
                <div class="space-y-2 w-full sm:w-72">
                    <label for="party-name" class="text-xs font-bold text-slate-400">副本名稱</label>
                    <input id="party-name" type="text" value={party?.name || ''} onblur={(e) => updateParty({ name: e.currentTarget.value })}
                        class="w-full bg-slate-900/80 border-2 border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100" />
                </div>

                <div class="space-y-2 w-full sm:w-56">
                    <label for="party-start-at" class="text-xs font-bold text-slate-400">日期時間</label>
                    <input id="party-start-at" type="datetime-local" value={party?.start_at ? new Date(party.start_at).toISOString().slice(0,16) : ''}
                        onchange={(e) => updateParty({ start_at: e.currentTarget.value ? new Date(e.currentTarget.value).toISOString() : null })}
                        class="w-full bg-slate-900/80 border-2 border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100" />
                </div>

                <div class="space-y-2 w-full sm:w-40">
                    <label for="party-status" class="text-xs font-bold text-slate-400">團隊狀態</label>
                    <select id="party-status" value={party?.status} onchange={(e) => updateParty({ status: e.currentTarget.value })}
                        class="w-full bg-slate-900/80 border-2 border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100">
                        <option value="recruiting">招募中</option>
                        <option value="ready">已準備</option>
                        <option value="finished">已出團</option>
                    </select>
                </div>

                <div class="space-y-2 w-full sm:w-40">
                    <label for="party-raid-mode" class="text-xs font-bold text-slate-400">副本模式</label>
                    <select id="party-raid-mode" value={party?.raid_mode} onchange={(e) => updateParty({ raid_mode: parseInt(e.currentTarget.value) })}
                        class="w-full bg-slate-900/80 border-2 border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100">
                        <option value="1">百業</option>
                        <option value="2">俠竟</option>
                        <option value="3">百業+俠境</option>
                    </select>
                </div>

                <div class="space-y-2 w-full sm:w-32">
                    <label for="party-gear-limit" class="text-xs font-bold text-slate-400">裝分限制</label>
                    <input id="party-gear-limit" type="number" value={party?.gear_limit || 0} onblur={(e) => updateParty({ gear_limit: parseInt(e.currentTarget.value) || 0 })}
                        class="w-full bg-slate-900/80 border-2 border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100" />
                </div>

                <div class="space-y-2 w-full sm:w-32">
                    <label for="party-run-type" class="text-xs font-bold text-slate-400">種類</label>
                    <select id="party-run-type" value={party?.run_type} onchange={(e) => updateParty({ run_type: parseInt(e.currentTarget.value) })}
                        class="w-full bg-slate-900/80 border-2 border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100">
                        <option value="1">拓荒</option>
                        <option value="2">速刷</option>
                        <option value="3">教學</option>
                    </select>
                </div>
                
                <div class="space-y-2 w-full sm:w-28">
                    <label for="party-level-slot" class="text-xs font-bold text-slate-400">等級</label>
                    <input id="party-level-slot" type="number" step="1" min="0" inputmode="numeric" value={party?.level_slot ?? 0} onblur={(e) => updateParty({ level_slot: e.currentTarget.value ? parseInt(e.currentTarget.value) : 0 })}
                        class="w-full bg-slate-900/80 border-2 border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100" />
                </div>
            </div>

            <!-- 已移除頁面頂部的標籤按鈕（成員管理 / 變更記錄） -->

        {#if activeTab === 'members'}
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {#each slots as slot (slot.id)}
                    <div class="relative group">
                        <div class="aspect-3/4 bg-linear-to-br from-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-2xl flex flex-col overflow-hidden shadow-2xl transition-all duration-300 hover:border-indigo-500/70 hover:shadow-indigo-500/20 hover:scale-[1.02]">

                        <div class="p-2 flex items-center gap-2 border-b border-slate-700/50 bg-linear-to-br from-slate-800/80 to-slate-900/80 backdrop-blur">
                            <div class="w-6 h-6 shrink-0 flex items-center justify-center bg-linear-to-br from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-black shadow-lg">
                                {slot.slot_order + 1}
                            </div>
                            <button 
                                type="button"
                                onclick={() => updateSlot(slot.id, { role: slot.role === 'leader' ? '' : 'leader' })}
                                class="flex-1 py-1 rounded-lg text-xs font-bold transition-all border
                                {slot.role === 'leader' ? 'bg-linear-to-r from-red-500/30 to-rose-500/30 border-red-500/60 text-red-200 shadow-lg shadow-red-500/20' : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500'}"
                                aria-label="切換隊長標記"
                            >
                                {slot.role === 'leader' ? '👑 隊長' : '隊長'}
                            </button>
                            <button 
                                type="button"
                                onclick={() => updateSlot(slot.id, { role: slot.role === 'helper' ? '' : 'helper' })}
                                class="flex-1 py-1 rounded-lg text-xs font-bold transition-all border
                                {slot.role === 'helper' ? 'bg-linear-to-r from-amber-500/30 to-orange-500/30 border-amber-500/60 text-amber-200 shadow-lg shadow-amber-500/20' : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500'}"
                                aria-label="切換幫打標記"
                            >
                                {slot.role === 'helper' ? '🤝 幫打' : '幫打'}
                            </button>
                        </div>

                        <div class="p-3 flex flex-col flex-1 gap-2">
                            <div class="space-y-2">
                                <label for="pos-{slot.id}" class="text-xs font-black text-slate-400 uppercase tracking-wider ml-1 block">職位角色</label>
                                <select 
                                    id="pos-{slot.id}"
                                    value={slot.position_type}
                                    onchange={(e) => updateSlot(slot.id, { position_type: e.currentTarget.value })}
                                    class="w-full appearance-none {positionConfig[slot.position_type]?.bg || 'bg-slate-700'} border-2 {positionConfig[slot.position_type]?.border || 'border-slate-600'} {positionConfig[slot.position_type]?.text || 'text-white'} rounded-xl px-3 py-2.5 text-sm font-bold outline-none cursor-pointer transition-all hover:brightness-110 focus:ring-4 focus:ring-indigo-500/30"
                                    aria-label="選擇職位"
                                >
                                    <option value="tank">🛡️ 坦克</option>
                                    <option value="heal">🌿 補師</option>
                                    <option value="dps">⚔️ 輸出</option>
                                </select>
                            </div>

                            <div class="space-y-2">
                                <label for="name-{slot.id}" class="text-xs font-black text-slate-400 uppercase tracking-wider ml-1 block">玩家暱稱</label>
                                <input 
                                    id="name-{slot.id}"
                                    type="text"
                                    value={slot.display_name || ''}
                                    placeholder="輸入暱稱..."
                                    onblur={(e) => updateSlot(slot.id, { display_name: e.currentTarget.value })}
                                    class="w-full bg-slate-900/80 border-2 border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/30 outline-none transition-all"
                                    aria-label="輸入玩家暱稱"
                                />
                            </div>

                            <div class="mt-auto pt-3 border-t border-slate-700/50">
                                <label for="gs-{slot.id}" class="text-xs font-black text-slate-400 uppercase tracking-wider ml-1 block mb-2">裝分</label>
                                <input 
                                    id="gs-{slot.id}"
                                    type="number"
                                    value={slot.gear_score || 0}
                                    onblur={(e) => updateSlot(slot.id, { gear_score: parseInt(e.currentTarget.value) || 0 })}
                                    class="w-full bg-transparent border-none px-2 py-1 text-2xl font-mono font-bold text-center bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent focus:from-indigo-300 focus:to-purple-300 transition-all outline-none"
                                    aria-label="輸入裝備分數"
                                />
                            </div>
                        </div>
                    </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="bg-linear-to-br from-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
                <div class="p-5 bg-linear-to-r from-indigo-600/20 to-purple-600/20 font-bold border-b border-slate-700/50 flex items-center gap-3">
                    <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span class="text-lg">變更記錄</span>
                </div>
                <div class="max-h-150 overflow-y-auto p-5 space-y-3">
                    {#if changeLogs.length === 0}
                        <div class="text-center py-12">
                            <div class="text-6xl mb-4">📋</div>
                            <p class="text-slate-400">暫無變更記錄</p>
                        </div>
                    {:else}
                        {#each changeLogs as log}
                            <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-sm text-slate-300">
                                        <strong class="text-indigo-400 font-bold">{log.actor_name}</strong> 
                                        <span class="text-slate-400">{log.details}</span>
                                    </span>
                                    <span class="text-xs font-mono text-slate-500 uppercase whitespace-nowrap ml-3">
                                        {new Date(log.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        {/if}
    </main>
</div>

<style>
    /* 優化輸入框樣式 */
    input:focus, select:focus {
        outline: none;
    }

    /* 隱藏數字輸入框的微調按鈕 */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    
    input[type=number] {
        appearance: textfield;
        -moz-appearance: textfield;
    }

    /* 全局背景色 */
    :global(body) {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    }

    /* 自定義滾動條 */
    ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }

    ::-webkit-scrollbar-track {
        background: #1e293b;
        border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb {
        background: #475569;
        border-radius: 10px;
        border: 2px solid #1e293b;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #64748b;
    }
</style>