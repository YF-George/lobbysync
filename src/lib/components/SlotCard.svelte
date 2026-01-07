<script lang="ts">
    import * as Y from 'yjs';
    interface Props {
        slot: Y.Map<any>;
        isAdmin: boolean;
    }
    let { slot, isAdmin }: Props = $props();

    let name = $state('');
    let role = $state('');

    $effect(() => {
        // 初始化與監聽 slot 變動
        const obs = () => {
            name = slot.get('name');
            role = slot.get('role');
        };
        // 先將初始值同步
        obs();
        slot.observe(obs);
        return () => slot.unobserve(obs);
    });

    function update(key: string, val: any) {
        slot.set(key, val);
    }
</script>

<div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative group transition-all duration-300">
    <div class="space-y-3">
        <div>
            <label for={"slot-name-" + (slot.get('id') ?? crypto.randomUUID())} class="text-[10px] font-bold text-slate-400 uppercase">玩家</label>
            <input 
                id={"slot-name-" + (slot.get('id') ?? crypto.randomUUID())}
                type="text" 
                value={name} 
                oninput={(e) => update('name', e.currentTarget.value)}
                placeholder="輸入名稱..."
                class="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 ring-indigo-500"
            />
        </div>
        <div>
            <label for={"slot-role-" + (slot.get('id') ?? crypto.randomUUID())} class="text-[10px] font-bold text-slate-400 uppercase">角色</label>
            <select 
                id={"slot-role-" + (slot.get('id') ?? crypto.randomUUID())}
                value={role} 
                onchange={(e) => update('role', e.currentTarget.value)}
                class="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm"
            >
                <option value="TANK">坦克</option>
                <option value="HEALER">治療</option>
                <option value="DPS">輸出</option>
            </select>
        </div>
    </div>

    {#if isAdmin}
        <button 
            onclick={() => {
                try {
                    const parent = slot.parent as unknown as Y.Array<any>;
                    if (parent && typeof parent.toArray === 'function') {
                        const arr = parent.toArray();
                        const idx = arr.indexOf(slot as any);
                        if (idx !== -1) parent.delete(idx, 1);
                    }
                } catch(e) { console.warn('delete slot failed', e) }
            }}
            class="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
        >
            ✕
        </button>
    {/if}
</div>
