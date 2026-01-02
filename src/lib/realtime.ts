// Realtime 訂閱輔助函式（前端使用）
// 用途：讓前端可以輕鬆訂閱特定 party 的即時更新
// 需要：在前端初始化時提供 Supabase client（使用 PUBLIC_SUPABASE_ANON_KEY）

import { supabase } from '$lib/supabaseClient';

/**
 * 訂閱特定 party 的 slot 更新
 * @param partyId - party 的 UUID
 * @param onSlotUpdate - 收到更新時的 callback
 * @returns unsubscribe 函式，呼叫後取消訂閱
 * 
 * 使用範例：
 * ```ts
 * const unsubscribe = subscribeToPartyUpdates('party-uuid', (payload) => {
 *   console.log('slot 已更新:', payload.slot);
 *   // 更新 UI 狀態
 * });
 * 
 * // 離開頁面時記得取消訂閱
 * onDestroy(() => unsubscribe());
 * ```
 */
export function subscribeToPartyUpdates(
  partyId: string,
  onSlotUpdate: (payload: any) => void
) {
  const channel = supabase.channel(`party:${partyId}`);

  channel
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'slot',
        filter: `raid_id=eq.${partyId}`
      },
      (payload) => {
        console.log('🔔 Database Changes:', payload);
        onSlotUpdate(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✓ 已訂閱 party:${partyId} 的即時更新（Database Changes）`);
      }
    });

  // 回傳 unsubscribe 函式
  return () => {
    supabase.removeChannel(channel);
    console.log(`✗ 已取消訂閱 party:${partyId}`);
  };
}

/**
 * 訂閱特定 party 的所有變更（slot + party 設定）
 * 可擴充支援更多事件類型
 */
export function subscribeToParty(partyId: string, handlers: {
  onSlotUpdate?: (payload: any) => void;
  onPartyUpdate?: (payload: any) => void;
  onMemberJoin?: (payload: any) => void;
}) {
  const channel = supabase.channel(`party:${partyId}`);

  if (handlers.onSlotUpdate) {
    channel.on('broadcast', { event: 'slot_updated' }, ({ payload }) => {
      handlers.onSlotUpdate?.(payload);
    });
  }

  if (handlers.onPartyUpdate) {
    channel.on('broadcast', { event: 'party_updated' }, ({ payload }) => {
      handlers.onPartyUpdate?.(payload);
    });
  }

  if (handlers.onMemberJoin) {
    channel.on('broadcast', { event: 'member_joined' }, ({ payload }) => {
      handlers.onMemberJoin?.(payload);
    });
  }

  channel.subscribe();

  return () => supabase.removeChannel(channel);
}
