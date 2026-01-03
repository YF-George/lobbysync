// Supabase Presence 管理 - 追蹤線上用戶與編輯狀態
// 用途：顯示誰在線、誰正在編輯哪個欄位

import { supabase } from '$lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
	user_id: string;
	user_name: string;
	is_admin?: boolean;
	editing_field?: string; // 格式: "party-id:slot-index:field-name"
	last_seen?: number;
}

export interface PresenceState {
	[key: string]: PresenceUser[];
}

/**
 * 加入 Presence channel 並追蹤線上用戶
 * @param partyId - 派對 ID
 * @param userId - 當前用戶 ID
 * @param userName - 當前用戶名稱
 * @param isAdmin - 是否為管理員
 * @returns { channel, updatePresence, getOnlineUsers }
 */
export function joinPresence(
	partyId: string,
	userId: string,
	userName: string,
	isAdmin: boolean = false
) {
	const channelName = `presence:party:${partyId}`;
	const channel: RealtimeChannel = supabase.channel(channelName, {
		config: {
			presence: {
				key: userId
			}
		}
	});

	// 訂閱 presence 事件
	channel
		.on('presence', { event: 'sync' }, () => {
			const state = channel.presenceState() as PresenceState;
			console.log('Presence synced:', state);
		})
		.on('presence', { event: 'join' }, ({ key, newPresences }) => {
			console.log('User joined:', key, newPresences);
		})
		.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
			console.log('User left:', key, leftPresences);
		})
		.subscribe(async (status) => {
			if (status === 'SUBSCRIBED') {
				// 追蹤自己的上線狀態
				await channel.track({
					user_id: userId,
					user_name: userName,
					is_admin: isAdmin,
					online_at: Date.now()
				});
			}
		});

	/**
	 * 更新當前用戶的 presence 狀態（例如正在編輯的欄位）
	 */
	const updatePresence = async (updates: Partial<PresenceUser>) => {
		try {
			await channel.track({
				user_id: userId,
				user_name: userName,
				is_admin: isAdmin,
				...updates,
				last_seen: Date.now()
			});
		} catch (err) {
			console.error('Failed to update presence:', err);
		}
	};

	/**
	 * 獲取所有線上用戶
	 */
	const getOnlineUsers = (): PresenceUser[] => {
		const state = channel.presenceState() as PresenceState;
		const users: PresenceUser[] = [];
		
		Object.values(state).forEach((presences) => {
			presences.forEach((presence) => {
				users.push(presence);
			});
		});
		
		return users;
	};

	/**
	 * 離開並清理 channel
	 */
	const leave = async () => {
		await channel.untrack();
		await supabase.removeChannel(channel);
	};

	return {
		channel,
		updatePresence,
		getOnlineUsers,
		leave
	};
}

/**
 * 標記正在編輯的欄位（防止衝突編輯）
 */
export function markFieldEditing(
	updatePresence: (updates: Partial<PresenceUser>) => Promise<void>,
	fieldKey: string | null
) {
	updatePresence({
		editing_field: fieldKey || undefined
	});
}
