<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { subscribeToPartyUpdates } from '$lib/realtime';

  // 示範：訂閱並即時更新 slot 的範例元件
  // 用途：放在 party 詳情頁，讓所有觀看者看到即時同步的隊伍狀態

  let partyId = 'your-party-uuid-here'; // 從 page data 或 URL params 取得
  let slots: any[] = $state([]);
  let lastUpdate = $state('');
  let unsubscribe: (() => void) | null = null;

  onMount(() => {
    // 訂閱即時更新
    unsubscribe = subscribeToPartyUpdates(partyId, (payload) => {
      console.log('收到 slot 更新:', payload);
      
      // 找到對應的 slot 並更新（optimistic update 已做過，這裡是確認用）
      const index = slots.findIndex((s) => s.id === payload.slot.id);
      if (index !== -1) {
        slots[index] = payload.slot;
        slots = [...slots]; // 觸發 Svelte 重新渲染
      }
      
      lastUpdate = new Date(payload.timestamp).toLocaleString('zh-TW');
    });
  });

  onDestroy(() => {
    // 離開頁面時取消訂閱，避免記憶體洩漏
    unsubscribe?.();
  });

  async function updateSlot(slotId: string, changes: any) {
    // Optimistic update：先更新 UI
    const index = slots.findIndex((s) => s.id === slotId);
    if (index !== -1) {
      const oldSlot = slots[index];
      slots[index] = { ...oldSlot, ...changes };
      slots = [...slots];

      try {
        // 呼叫 API（需要帶上 x-user-id header）
        const res = await fetch(`/api/slot/${slotId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': '123' // 實際上應從 auth session 取得
          },
          body: JSON.stringify(changes)
        });

        if (!res.ok) {
          // 若失敗，回滾到舊值
          slots[index] = oldSlot;
          slots = [...slots];
          const err = await res.json();
          alert(`更新失敗: ${err.error}`);
        }
      } catch (err) {
        // 網路錯誤，回滾
        slots[index] = oldSlot;
        slots = [...slots];
        alert('網路錯誤，請重試');
      }
    }
  }
</script>

<div class="party-realtime-demo">
  <h2>即時隊伍狀態（Realtime 同步）</h2>
  <p>最後更新：{lastUpdate || '尚未更新'}</p>
  
  <div class="slots-grid">
    {#each slots as slot (slot.id)}
      <div class="slot-card">
        <input
          type="text"
          value={slot.display_name || ''}
          placeholder="名稱"
          onblur={(e) => updateSlot(slot.id, { display_name: e.currentTarget.value })}
        />
        <input
          type="number"
          value={slot.gear_score || 0}
          placeholder="裝分"
          onblur={(e) => updateSlot(slot.id, { gear_score: Number(e.currentTarget.value) })}
        />
        <select
          value={slot.position_type}
          onchange={(e) => updateSlot(slot.id, { position_type: e.currentTarget.value })}
        >
          <option value="tank">坦</option>
          <option value="heal">補</option>
          <option value="dps">輸出</option>
        </select>
      </div>
    {/each}
  </div>
</div>

<style>
  .party-realtime-demo {
    padding: 1rem;
  }
  
  .slots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .slot-card {
    border: 1px solid #ccc;
    padding: 0.5rem;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  input, select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
</style>
