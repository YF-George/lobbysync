<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { subscribeToPartyUpdates } from '$lib/realtime';
  import supabase from '$lib/supabaseClient';

  let partyId = $derived($page.url.searchParams.get('party') || 'test-party-001');
  let party: any = $state(null);
  let slots: any[] = $state([]);
  let lastUpdate = $state('');
  let loading = $state(true);
  let error = $state('');
  let unsubscribe: (() => void) | null = null;
  let authToken = $state('');
  let isAuthenticated = $state(false);

  // 匿名登入取得 JWT token
  async function signInAnonymously() {
    try {
      const { data, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) throw authError;
      
      const session = data.session;
      if (session) {
        authToken = session.access_token;
        isAuthenticated = true;
        console.log('✅ 匿名登入成功，Token:', authToken.substring(0, 20) + '...');
      }
    } catch (err: any) {
      console.error('❌ 登入失敗:', err);
      error = '登入失敗: ' + err.message;
    }
  }

  async function loadParty() {
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/party/${partyId}`);
      if (!res.ok) throw new Error('載入失敗');
      const data = await res.json();
      party = data.party;
      slots = data.slots;
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    // 先登入取得 token
    await signInAnonymously();
    
    // 載入 party 資料
    loadParty();

    // 訂閱即時更新（Database Changes 模式）
    unsubscribe = subscribeToPartyUpdates(partyId, (updatedSlot) => {
      console.log('🔔 收到即時更新:', updatedSlot);
      
      const index = slots.findIndex((s) => s.id === updatedSlot.id);
      if (index !== -1) {
        slots[index] = updatedSlot;
        slots = [...slots];
      }
      
      lastUpdate = new Date().toLocaleString('zh-TW');
    });
  });

  onDestroy(() => {
    unsubscribe?.();
  });

  async function updateSlot(slotId: string, changes: any) {
    if (!isAuthenticated) {
      alert('請先登入');
      return;
    }

    const index = slots.findIndex((s) => s.id === slotId);
    if (index === -1) return;

    // Optimistic update
    const oldSlot = slots[index];
    slots[index] = { ...oldSlot, ...changes };
    slots = [...slots];

    try {
      const res = await fetch(`/api/slot/${slotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // 使用 JWT token
        },
        body: JSON.stringify(changes)
      });

      if (!res.ok) {
        slots[index] = oldSlot;
        slots = [...slots];
        const err = await res.json();
        alert(`更新失敗: ${err.error}`);
      }
    } catch (err) {
      slots[index] = oldSlot;
      slots = [...slots];
      alert('網路錯誤，請重試');
    }
  }

  function getPositionColor(pos: string) {
    switch (pos) {
      case 'tank': return 'border-blue-500 bg-blue-50';
      case 'heal': return 'border-green-500 bg-green-50';
      case 'dps': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300';
    }
  }

  function toggleTag(slotId: string, tag: string) {
    const index = slots.findIndex((s) => s.id === slotId);
    if (index === -1) return;
    
    const currentTags = slots[index].tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t: string) => t !== tag)
      : [...currentTags, tag];
    
    updateSlot(slotId, { tags: newTags });
  }

  const tagLabels = {
    leader: '🎖️ 隊長',
    substitute: '🔄 幫打',
    alt: '🔸 替補',
    backup: '💾 備用'
  };
</script>

<div class="max-w-6xl mx-auto p-4">
  <div class="mb-6">
    <h1 class="text-3xl font-bold mb-2">即時副本組隊測試頁</h1>
    <p class="text-gray-600">Party ID: <code class="bg-gray-100 px-2 py-1 rounded">{partyId}</code></p>
    <div class="flex items-center gap-3 mt-2">
      {#if isAuthenticated}
        <span class="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">✅ JWT 驗證已啟用</span>
      {:else}
        <span class="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">⏳ 登入中...</span>
      {/if}
      {#if lastUpdate}
        <p class="text-sm text-green-600">最後同步: {lastUpdate}</p>
      {/if}
    </div>
  </div>

  <div class="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
    <h3 class="font-bold mb-2">🧪 測試步驟：</h3>
    <ol class="list-decimal list-inside space-y-1 text-sm">
      <li>複製當前網址，開啟第二個瀏覽器分頁</li>
      <li>在任一分頁修改名稱、裝分或職位</li>
      <li>觀察另一個分頁是否在 500ms 內同步更新</li>
      <li>檢查瀏覽器 Console 是否有「🔔 收到即時更新」訊息</li>
    </ol>
  </div>

  {#if loading}
    <div class="text-center py-8">載入中...</div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 p-4 rounded text-red-700">
      錯誤: {error}
    </div>
  {:else if party}
    <div class="bg-white border rounded-lg p-4 mb-6">
      <h2 class="text-xl font-bold mb-2">{party.name}</h2>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>裝分門檻: <strong>{party.gear_limit}</strong></div>
        <div>狀態: <strong>{party.status}</strong></div>
        <div>當前人數: <strong>{party.current_players}/{party.max_players}</strong></div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {#each slots as slot (slot.id)}
        <div class="border-2 rounded-lg p-4 {getPositionColor(slot.position_type)}">
          <div class="text-xs text-gray-500 mb-2">位置 {slot.slot_order + 1}</div>
          
          <select
            value={slot.position_type}
            onchange={(e) => updateSlot(slot.id, { position_type: e.currentTarget.value })}
            class="w-full mb-2 p-1 border rounded text-sm"
          >
            <option value="tank">🛡️ 坦</option>
            <option value="heal">💚 補</option>
            <option value="dps">⚔️ 輸出</option>
          </select>

          <input
            type="text"
            value={slot.display_name || ''}
            placeholder="名稱"
            onblur={(e) => updateSlot(slot.id, { display_name: e.currentTarget.value })}
            class="w-full mb-2 p-2 border rounded text-sm"
          />

          <input
            type="number"
            value={slot.gear_score || 0}
            placeholder="裝分"
            onblur={(e) => updateSlot(slot.id, { gear_score: Number(e.currentTarget.value) })}
            class="w-full p-2 border rounded text-sm"
          />

          <div class="mt-2 space-y-1">
            {#each Object.entries(tagLabels) as [tag, label]}
              <label class="flex items-center text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={slot.tags?.includes(tag) || false}
                  onchange={() => toggleTag(slot.id, tag)}
                  class="mr-1"
                />
                <span>{label}</span>
              </label>
            {/each}
          </div>

          <div class="text-xs text-gray-500 mt-2">
            狀態: {slot.status}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
