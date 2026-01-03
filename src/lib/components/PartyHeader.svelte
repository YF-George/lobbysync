<script lang="ts">
  interface Party {
    id: string;
    name: string;
    raid_mode: number;
    run_type: number;
    start_at: string | null;
    status: string;
    gear_limit: number;
    max_players: number;
    current_players: number;
    note: string | null;
    discord_webhook: string | null;
  }

  interface Props {
    party: Party;
    editable?: boolean;
  }

  let { party, editable = false }: Props = $props();

  const statusConfig: Record<string, { label: string; color: string }> = {
    recruiting: { label: '招募中', color: 'bg-green-100 text-green-800' },
    full: { label: '已滿', color: 'bg-gray-100 text-gray-800' },
    in_progress: { label: '進行中', color: 'bg-blue-100 text-blue-800' },
    completed: { label: '已完成', color: 'bg-purple-100 text-purple-800' },
    cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' }
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
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const statusInfo = $derived(statusConfig[party.status] || statusConfig.recruiting);
  const progressPercent = $derived(
    party.max_players > 0 ? Math.round((party.current_players / party.max_players) * 100) : 0
  );
</script>

<div class="bg-white border-2 rounded-lg shadow-md overflow-hidden">
  <!-- 標題區 -->
  <div class="bg-linear-to-r from-blue-600 to-blue-700 text-white p-5">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h2 class="text-2xl font-bold mb-2">{party.name}</h2>
        <div class="flex items-center gap-2 text-sm opacity-90">
          <span class="px-2 py-1 bg-white/20 rounded">
            {raidModeLabels[party.raid_mode]}
          </span>
          <span class="px-2 py-1 bg-white/20 rounded">
            {runTypeLabels[party.run_type]}
          </span>
          <span class="px-2 py-1 {statusInfo.color} text-gray-900 rounded font-medium">
            {statusInfo.label}
          </span>
        </div>
      </div>

      {#if party.gear_limit > 0}
        <div class="text-right bg-white/10 rounded-lg px-4 py-2">
          <div class="text-xs opacity-75">裝分門檻</div>
          <div class="text-3xl font-bold">{party.gear_limit}</div>
        </div>
      {/if}
    </div>
  </div>

  <!-- 詳細資訊 -->
  <div class="p-5">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <!-- 人數進度 -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600">👥 隊伍人數</span>
          <span class="text-sm font-bold text-gray-900">
            {party.current_players} / {party.max_players}
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            class="bg-linear-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 flex items-center justify-center text-xs text-white font-bold"
            style="width: {progressPercent}%"
          >
            {#if progressPercent > 20}
              {progressPercent}%
            {/if}
          </div>
        </div>
      </div>

      <!-- 開始時間 -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="text-sm font-medium text-gray-600 mb-2">🕒 開始時間</div>
        <div class="text-lg font-bold text-gray-900">
          {formatDate(party.start_at)}
        </div>
      </div>
    </div>

    <!-- 備註 -->
    {#if party.note}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div class="text-sm font-semibold text-yellow-900 mb-1">📝 備註</div>
        <p class="text-sm text-yellow-800 whitespace-pre-wrap">{party.note}</p>
      </div>
    {/if}

    <!-- Discord Webhook -->
    {#if party.discord_webhook}
      <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-indigo-900">💬 Discord 通知已啟用</span>
          {#if editable}
            <button class="text-xs text-indigo-600 hover:text-indigo-800 underline">
              編輯 Webhook
            </button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
