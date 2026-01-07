<script lang="ts">
    export let activeTab: number = 1;
    export let presence: Record<number, number> = {};

    // two-way bind helper
    export function setActive(n: number) {
        activeTab = n;
    }
</script>

<div class="flex gap-2 items-center">
    {#each Array.from({length:12}, (_,i)=>i+1) as n}
        <button onclick={() => setActive(n)} class="px-3 py-1 rounded-full border" class:active={activeTab===n}>
            {n}
            {#if presence[n]}
                <span class="ml-2 text-xs text-slate-500">{presence[n]}</span>
            {/if}
        </button>
    {/each}
</div>

<style>
.active { background-color: #eef2ff }
</style>
