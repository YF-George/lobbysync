<script lang="ts">
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
    slot: Slot;
    editable?: boolean;
    onUpdate?: (changes: Partial<Slot>) => void;
  }

  let { slot, editable = false, onUpdate }: Props = $props();

  const positionConfig: Record<string, { icon: string; color: string; label: string; borderColor: string }> = {
    tank: { 
      icon: '🛡️', 
      color: 'bg-blue-50', 
      label: '坦克',
      borderColor: 'border-blue-500'
    },
    heal: { 
      icon: '💚', 
      color: 'bg-green-50', 
      label: '補師',
      borderColor: 'border-green-500'
    },
    dps: { 
      icon: '⚔️', 
      color: 'bg-red-50', 
      label: '輸出',
      borderColor: 'border-red-500'
    }
  };

  const tagLabels: Record<string, { label: string; color: string }> = {
    leader: { label: '🎖️ 隊長', color: 'bg-yellow-100 text-yellow-800' },
    substitute: { label: '🔄 幫打', color: 'bg-purple-100 text-purple-800' },
    alt: { label: '🔸 替補', color: 'bg-orange-100 text-orange-800' },
    backup: { label: '💾 備用', color: 'bg-gray-100 text-gray-800' }
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    open: { label: '空位', color: 'text-gray-500' },
    reserved: { label: '預約', color: 'text-yellow-600' },
    filled: { label: '已填', color: 'text-green-600' },
    locked: { label: '鎖定', color: 'text-red-600' }
  };

  function handleUpdate(field: string, value: any) {
    if (!editable || !onUpdate) return;
    onUpdate({ [field]: value });
  }

  function toggleTag(tag: string) {
    if (!editable || !onUpdate) return;
    
    const tags = slot.tags || [];
    const newTags = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    
    onUpdate({ tags: newTags });
  }

  const posInfo = $derived(positionConfig[slot.position_type] || positionConfig.dps);
  const statusInfo = $derived(statusLabels[slot.status] || statusLabels.open);
  const isEmpty = $derived(!slot.display_name || slot.display_name.trim() === '');
</script>

<div class="border-2 rounded-lg p-4 {posInfo.color} {posInfo.borderColor} transition-all hover:shadow-md bg-white/50 backdrop-blur-sm">
  <!-- 頂部資訊列 -->
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <span class="text-lg">{posInfo.icon}</span>
      <div class="text-xs font-semibold text-gray-600">
        位置 {slot.slot_order + 1}
      </div>
    </div>
    <div class="text-xs font-medium {statusInfo.color}">
      {statusInfo.label}
    </div>
  </div>

  <!-- 職位選擇/顯示 -->
  {#if editable}
    <select
      value={slot.position_type}
      onchange={(e) => handleUpdate('position_type', e.currentTarget.value)}
      class="w-full mb-3 p-2 border rounded text-sm font-medium bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
    >
      <option value="tank">{positionConfig.tank.icon} {positionConfig.tank.label}</option>
      <option value="heal">{positionConfig.heal.icon} {positionConfig.heal.label}</option>
      <option value="dps">{positionConfig.dps.icon} {positionConfig.dps.label}</option>
    </select>
  {:else}
    <div class="mb-3 p-2 text-sm font-semibold text-center rounded bg-white/70">
      {posInfo.label}
    </div>
  {/if}

  <!-- 玩家名稱 -->
  <div class="mb-3">
    {#if editable}
      <input
        type="text"
        value={slot.display_name || ''}
        placeholder="輸入角色名稱"
        onblur={(e) => handleUpdate('display_name', e.currentTarget.value)}
        class="w-full p-2 border rounded text-sm font-medium bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
      />
    {:else}
      <div class="p-2 text-sm font-bold text-center rounded bg-white/70 {isEmpty ? 'text-gray-400 italic' : 'text-gray-900'}">
        {slot.display_name || '(空位)'}
      </div>
    {/if}
  </div>

  <!-- 裝備分數 -->
  <div class="mb-3">
    {#if editable}
      <div class="relative">
        <input
          type="number"
          value={slot.gear_score || 0}
          placeholder="裝分"
          min="0"
          onblur={(e) => handleUpdate('gear_score', Number(e.currentTarget.value))}
          class="w-full p-2 pl-8 border rounded text-sm font-bold bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
        />
        <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">⚡</span>
      </div>
    {:else}
      <div class="text-center p-2 rounded bg-white/70">
        <div class="text-xs text-gray-500">裝分</div>
        <div class="text-xl font-bold text-gray-900">{slot.gear_score}</div>
      </div>
    {/if}
  </div>

  <!-- 標籤區 -->
  {#if editable}
    <div class="mt-3 pt-3 border-t border-gray-200">
      <div class="text-xs font-medium text-gray-600 mb-2">標籤</div>
      <div class="space-y-1">
        {#each Object.entries(tagLabels) as [tag, tagInfo]}
          <label class="flex items-center text-xs cursor-pointer hover:bg-white/70 px-2 py-1 rounded transition-colors">
            <input
              type="checkbox"
              checked={slot.tags?.includes(tag) || false}
              onchange={() => toggleTag(tag)}
              class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-400"
            />
            <span>{tagInfo.label}</span>
          </label>
        {/each}
      </div>
    </div>
  {:else if slot.tags && slot.tags.length > 0}
    <div class="mt-3 pt-3 border-t border-gray-200">
      <div class="flex flex-wrap gap-1">
        {#each slot.tags as tag}
          {@const tagInfo = tagLabels[tag]}
          {#if tagInfo}
            <span class="text-xs px-2 py-1 {tagInfo.color} rounded-full font-medium">
              {tagInfo.label}
            </span>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <!-- 備註 -->
  {#if editable}
    <div class="mt-3 pt-3 border-t border-gray-200">
      <textarea
        value={slot.note || ''}
        placeholder="備註（選填）"
        onblur={(e) => handleUpdate('note', e.currentTarget.value)}
        class="w-full p-2 border rounded text-xs bg-white resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
        rows="2"
      ></textarea>
    </div>
  {:else if slot.note}
    <div class="mt-3 pt-3 border-t border-gray-200">
      <div class="text-xs text-gray-500 mb-1">備註</div>
      <p class="text-xs text-gray-700 whitespace-pre-wrap">{slot.note}</p>
    </div>
  {/if}

  <!-- 更新時間 -->
  {#if !editable && slot.updated_at}
    <div class="mt-2 text-xs text-gray-400 text-center">
      更新於 {new Date(slot.updated_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
    </div>
  {/if}
</div>
