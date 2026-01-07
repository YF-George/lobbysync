<script lang="ts">
    import { onMount } from 'svelte';
    let { roomId } = $props();
    interface AuditLog { id?: string; roomId?: string; userId?: string; userName?: string; action?: string; detail?: any; createdAt?: string; }
    let logs = $state<AuditLog[]>([]);
    let isOpen = $state(false);

    async function fetchLogs() {
        try {
            const res = await fetch(`/api/rooms/${roomId}/logs`);
            if (res.ok) logs = await res.json();
        } catch (e) { console.warn('fetch logs failed', e) }
    }

    onMount(() => {
        fetchLogs();
        const timer = setInterval(fetchLogs, 30000);
        return () => clearInterval(timer);
    });
</script>

<button 
    onclick={() => isOpen = !isOpen}
    class="fixed right-4 bottom-4 bg-slate-800 text-white p-3 rounded-full shadow-2xl z-50 hover:scale-110 transition-transform"
>
    📋 紀錄
</button>

{#if isOpen}
    <div class="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-40 border-l border-slate-200 dark:border-slate-800 p-4 overflow-y-auto">
        <h2 class="font-bold text-lg mb-4">變更紀錄 (Audit Log)</h2>
        <div class="space-y-4">
            {#each logs as log}
                <div class="text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div class="flex justify-between text-slate-400">
                        <span>{log.userName}</span>
                        <span>{log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}</span>
                    </div>
                    <p class="mt-1 text-slate-700 dark:text-slate-300">{log.action}</p>
                </div>
            {/each}
        </div>
    </div>
{/if}
