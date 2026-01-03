<script lang="ts">
  import PartyHeader from './PartyHeader.svelte';
  import TeamGrid from './TeamGrid.svelte';

  interface Party {
    id: string;
    name: string;
    raid_mode: number;
    run_type: number;
    start_at: string | null;
    owner_id: number;
    status: string;
    is_locked: boolean;
    gear_limit: number;
    max_players: number;
    current_players: number;
    note: string | null;
    discord_webhook: string | null;
    created_at: string;
    updated_at: string;
  }

  interface Slot {
    id: string;
    raid_id: string;
    slot_order: number;
    position_type: string;
    user_id: number | null;
    display_name: string | null;
    gear_score: number;
    status: string;
    tags: string[] | null;
    note: string | null;
    updated_at: string;
  }

  interface Props {
    party: Party;
    slots: Slot[];
    editable?: boolean;
    onSlotUpdate?: (slotId: string, changes: Partial<Slot>) => void;
    onPartyUpdate?: (changes: Partial<Party>) => void;
  }

  let { party, slots, editable = false, onSlotUpdate, onPartyUpdate }: Props = $props();

  // 按照 slot_order 排序
  const sortedSlots = $derived([...slots].sort((a, b) => a.slot_order - b.slot_order));

  // 統計資訊
  const stats = $derived({
    tanks: slots.filter(s => s.position_type === 'tank' && s.display_name).length,
    healers: slots.filter(s => s.position_type === 'heal' && s.display_name).length,
    dps: slots.filter(s => s.position_type === 'dps' && s.display_name).length,
    filled: slots.filter(s => s.display_name && s.display_name.trim() !== '').length,
    total: slots.length,
    avgGear: slots.filter(s => s.gear_score > 0).length > 0 
      ? Math.round(slots.reduce((sum, s) => sum + s.gear_score, 0) / slots.filter(s => s.gear_score > 0).length)
      : 0
  });

  const isReady = $derived(stats.filled === stats.total && stats.avgGear >= party.gear_limit);
</script>

<div class="max-w-7xl mx-auto p-4 space-y-6">
  <!-- 副本標題區 -->
  <PartyHeader {party} {editable} />

  <!-- 統計資訊卡 -->
  <div class="bg-linear-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-5 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-gray-800">📊 隊伍統計</h3>
      {#if isReady}
        <span class="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold animate-pulse">
          ✓ 可以出發
        </span>
      {:else}
        <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          準備中...
        </span>
      {/if}
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <!-- 坦克 -->
      <div class="bg-white rounded-lg p-3 border-l-4 border-blue-500">
        <div class="text-xs text-gray-600 mb-1">🛡️ 坦克</div>
        <div class="text-2xl font-bold text-gray-900">{stats.tanks}</div>
      </div>

      <!-- 補師 -->
      <div class="bg-white rounded-lg p-3 border-l-4 border-green-500">
        <div class="text-xs text-gray-600 mb-1">💚 補師</div>
        <div class="text-2xl font-bold text-gray-900">{stats.healers}</div>
      </div>

      <!-- 輸出 -->
      <div class="bg-white rounded-lg p-3 border-l-4 border-red-500">
        <div class="text-xs text-gray-600 mb-1">⚔️ 輸出</div>
        <div class="text-2xl font-bold text-gray-900">{stats.dps}</div>
      </div>

      <!-- 已填位置 -->
      <div class="bg-white rounded-lg p-3 border-l-4 border-purple-500">
        <div class="text-xs text-gray-600 mb-1">👥 已填/總數</div>
        <div class="text-2xl font-bold text-gray-900">{stats.filled}/{stats.total}</div>
      </div>

      <!-- 平均裝分 -->
      <div class="bg-white rounded-lg p-3 border-l-4 border-yellow-500">
        <div class="text-xs text-gray-600 mb-1">⚡ 平均裝分</div>
        <div class="text-2xl font-bold text-gray-900">{stats.avgGear}</div>
        {#if party.gear_limit > 0}
          <div class="text-xs text-gray-500 mt-1">
            門檻: {party.gear_limit}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- 隊伍網格 -->
  <div class="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-gray-800">👥 隊伍成員</h3>
      {#if editable}
        <span class="text-sm text-gray-500">✏️ 編輯模式</span>
      {/if}
    </div>
    
    <TeamGrid 
      slots={sortedSlots} 
      {editable}
      onUpdate={onSlotUpdate}
      columns={5}
    />
  </div>

  <!-- 操作按鈕區（可選） -->
  {#if editable}
    <div class="flex items-center justify-end gap-3 pt-4 border-t">
      <button class="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
        取消
      </button>
      <button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
        儲存變更
      </button>
    </div>
  {/if}
</div>
