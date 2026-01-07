<script lang="ts">
    import { onMount } from 'svelte';
    import { theme } from '$lib/theme';
    import { RoomSync } from '$lib/sync.svelte';
    import RoomHeader from '$lib/components/RoomHeader.svelte';
    import SlotCard from '$lib/components/SlotCard.svelte';
    import TabBar from '$lib/components/TabBar.svelte';
    import AuditLogPanel from '$lib/components/AuditLogPanel.svelte';

    // 這些資料通常由 +page.server.ts 提供；使用 $props() 讀取
    const { data } = $props() as any;
    let room = $state<any | null>(null);

    $effect(() => {
        const d = data ?? { room: { id: 'unknown', ownerId: '' }, user: { id: 'anon', username: '訪客' } };
        if (!room) {
            room = new RoomSync(
                d.room.id,
                { id: d.user.id, name: d.user.username },
                d.room.ownerId
            );
        }

        if (room?.provider) {
            room.provider.awareness.setLocalStateField('activeTab', room.activeTab);
        }
    });

    onMount(() => theme.init());
</script>

<div class="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <header class="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <h1 class="text-xl font-bold tracking-tight">Lobbysync</h1>
                <span class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    class:connected={room.isConnected}>
                    <span class:connected-dot={room.isConnected}></span>
                    {room.isConnected ? '已連線' : '連線中...'}
                </span>
            </div>
            
            <button onclick={() => theme.toggle()} class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:ring-2 ring-indigo-500 transition-all">
                {theme.current === 'light' ? '🌙' : '☀️'}
            </button>
        </div>
    </header>

    <main class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <TabBar bind:activeTab={room.activeTab} presence={room.presence} />

        <RoomHeader {room} />

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {#each room.currentSlots as slot (slot.get('id'))}
                <SlotCard {slot} isAdmin={room.isAdmin} />
            {/each}
            
            {#if room.isAdmin}
                <button 
                    onclick={() => room.addSlot()}
                    class="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl h-48 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-all gap-2 group"
                >
                    <span class="text-3xl group-hover:scale-110 transition-transform">+</span>
                    <span class="text-sm font-medium">新增位置</span>
                </button>
            {/if}
        </div>
    </main>
</div>

<style>
.connected { background-color: rgba(16,185,129,0.08); color: rgb(4,120,87); }
.connected-dot { height: 0.375rem; width: 0.375rem; border-radius: 9999px; background-color: rgb(16,185,129); display:inline-block; margin-right:0.5rem }
</style>

<AuditLogPanel roomId={room?.id} />
