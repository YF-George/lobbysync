<script lang="ts">
    export let room: any;
</script>

<div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-lg font-bold">{room?.party?.id ?? room?.id ?? '房間'}</h2>
            <p class="text-sm text-slate-400">擁有者：{room?.ownerId}</p>
        </div>
    </div>
</div>
