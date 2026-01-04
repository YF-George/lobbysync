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
	onSlotUpdate: (payload: any) => void,
	onPartyUpdate?: (payload: any) => void,
	onBatchSlotsUpdate?: (slots: any[]) => void
) {
	const channel = supabase.channel(`party:${partyId}`);

	// 優化：僅監聽 broadcast events，避免與 postgres_changes 重複
	// 單個 slot 更新（來自用戶編輯）
	if (onSlotUpdate) {
		channel.on('broadcast', { event: 'slot_updated' }, ({ payload }) => {
			console.log('🔔 Slot Broadcast:', payload);
			onSlotUpdate(payload);
		});
	}

	// 單個 party 更新（來自用戶編輯）
	if (onPartyUpdate) {
		channel.on('broadcast', { event: 'party_updated' }, ({ payload }) => {
			console.log('🔔 Party Broadcast:', payload);
			onPartyUpdate(payload);
		});
	}

	// 批量更新：party + 所有 slots（來自 refresh/repair/recreate）
	channel.on('broadcast', { event: 'party_and_slots_updated' }, ({ payload }) => {
		console.log('🔔 Party+Slots Batch:', payload);
		if (onPartyUpdate && payload.party) onPartyUpdate(payload.party);
		// 優先使用批量更新回調，減少重渲染
		if (onBatchSlotsUpdate && payload.slots && Array.isArray(payload.slots)) {
			onBatchSlotsUpdate(payload.slots);
		} else if (onSlotUpdate && payload.slots && Array.isArray(payload.slots)) {
			// fallback：逐個更新（會觸發多次重渲染，但保持向下兼容）
			for (const s of payload.slots) onSlotUpdate(s);
		}
	});

	channel.subscribe((status) => {
		if (status === 'SUBSCRIBED') {
			console.log(`✓ 已訂閱 party:${partyId} 的即時更新（Slot + Party Database Changes）`);
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
export function subscribeToParty(
	partyId: string,
	handlers: {
		onSlotUpdate?: (payload: any) => void;
		onPartyUpdate?: (payload: any) => void;
		onMemberJoin?: (payload: any) => void;
	}
) {
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
