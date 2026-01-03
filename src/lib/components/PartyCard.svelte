<script lang="ts">
  interface Party {
    id: string;
    name: string;
    raid_mode: number;
    run_type: number;
    start_at: string | null;
    owner_id: number;
    status: string;
    gear_limit: number;
    max_players: number;
    current_players: number;
    note: string | null;
    created_at: string;
    updated_at: string;
  }

  interface Props {
    party: Party;
    onclick?: () => void;
    showDetails?: boolean;
  }

  let { party, onclick, showDetails = true }: Props = $props();

  const statusConfig: Record<string, { label: string; color: string }> = {
    recruiting: { label: '招募中', color: 'bg-green-100 text-green-800 border-green-300' },
    full: { label: '已滿', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    in_progress: { label: '進行中', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    completed: { label: '已完成', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    cancelled: { label: '已取消', color: 'bg-red-100 text-red-800 border-red-300' }
  };

  const raidModeLabels: Record<number, string> = {
    1: '普通',
    2: '英雄',
    3: '史詩'
  };

  const runTypeLabels: Record<number, string> = {
    1: '首殺',
    2: '農裝',
    3: '休閒'
  };

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '未設定';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const statusInfo = $derived(statusConfig[party.status] || statusConfig.recruiting);
  const isClickable = $derived(!!onclick);
  
  function handleKeydown(e: KeyboardEvent) {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onclick?.();
    }
  }
</script>

{#if isClickable}
  <button
    type="button"
    class="w-full text-left bg-white border-2 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-400"
    onclick={onclick}
    onkeydown={handleKeydown}
  >
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <h3 class="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
          {party.name}
        </h3>
        <div class="flex items-center gap-2 text-sm">
          <span class="px-2 py-0.5 rounded {statusInfo.color} font-medium">
            {statusInfo.label}
          </span>
          <span class="text-gray-600">
            {raidModeLabels[party.raid_mode]} · {runTypeLabels[party.run_type]}
          </span>
        </div>
      </div>
      
      {#if party.gear_limit > 0}
        <div class="shrink-0 text-right">
          <div class="text-xs text-gray-500">裝分門檻</div>
          <div class="text-lg font-bold text-blue-600">{party.gear_limit}</div>
        </div>
      {/if}
    </div>

    {#if showDetails}
      <div class="grid grid-cols-2 gap-3 text-sm mb-3">
        <div class="flex items-center gap-2">
          <span class="text-gray-500">👥 人數:</span>
          <span class="font-semibold text-gray-900">
            {party.current_players}/{party.max_players}
          </span>
          {#if party.current_players >= party.max_players}
            <span class="text-xs text-red-600">(已滿)</span>
          {/if}
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-gray-500">🕒 開始:</span>
          <span class="font-medium text-gray-700">{formatDate(party.start_at)}</span>
        </div>
      </div>

      {#if party.note}
        <div class="mt-3 pt-3 border-t border-gray-100">
          <div class="text-xs text-gray-500 mb-1">備註</div>
          <p class="text-sm text-gray-700 line-clamp-2">{party.note}</p>
        </div>
      {/if}
    {/if}

    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
      <span>建立於 {formatDate(party.created_at)}</span>
      <span>更新於 {formatDate(party.updated_at)}</span>
    </div>
  </button>
{:else}
  <div class="bg-white border-2 rounded-lg p-5 shadow-sm">
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <h3 class="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
          {party.name}
        </h3>
        <div class="flex items-center gap-2 text-sm">
          <span class="px-2 py-0.5 rounded {statusInfo.color} font-medium">
            {statusInfo.label}
          </span>
          <span class="text-gray-600">
            {raidModeLabels[party.raid_mode]} · {runTypeLabels[party.run_type]}
          </span>
        </div>
      </div>
      
      {#if party.gear_limit > 0}
        <div class="shrink-0 text-right">
          <div class="text-xs text-gray-500">裝分門檻</div>
          <div class="text-lg font-bold text-blue-600">{party.gear_limit}</div>
        </div>
      {/if}
    </div>

    {#if showDetails}
      <div class="grid grid-cols-2 gap-3 text-sm mb-3">
        <div class="flex items-center gap-2">
          <span class="text-gray-500">👥 人數:</span>
          <span class="font-semibold text-gray-900">
            {party.current_players}/{party.max_players}
          </span>
          {#if party.current_players >= party.max_players}
            <span class="text-xs text-red-600">(已滿)</span>
          {/if}
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-gray-500">🕒 開始:</span>
          <span class="font-medium text-gray-700">{formatDate(party.start_at)}</span>
        </div>
      </div>

      {#if party.note}
        <div class="mt-3 pt-3 border-t border-gray-100">
          <div class="text-xs text-gray-500 mb-1">備註</div>
          <p class="text-sm text-gray-700 line-clamp-2">{party.note}</p>
        </div>
      {/if}
    {/if}

    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
      <span>建立於 {formatDate(party.created_at)}</span>
      <span>更新於 {formatDate(party.updated_at)}</span>
    </div>
  </div>
{/if}
