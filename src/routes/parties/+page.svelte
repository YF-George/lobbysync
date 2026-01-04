<script lang="ts">
	import { theme as _theme } from '$lib/stores/theme';
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { goto as _goto } from '$app/navigation';
	import type { PageData } from './$types';
	import {
		getRaidModeLabel,
		getRunTypeLabel,
		getStatusBadge as getStatusBadgeUtil
	} from '$lib/constants/labels';
	import { getPositionColor } from '$lib/constants/positions';

	let { data } = $props<{ data: PageData }>();

	let parties = $state<any[]>([]);
	let _isCreating = $state(false);
	let isRefreshing = $state(false);
	let _deletingId = $state<string | null>(null);
	let _localUserId = $state<number | null>(null);
	let partiesChannel: any = $state(null);
	let unsubscribe: any = undefined;

	$effect(() => {
		// 過濾掉由 seed script 自動建立的測試資料（id 以 test-party- 開頭）
		parties = (data.parties || [])
			.filter((p: any) => {
				if (!p || !p.id) return false;
				return !String(p.id).startsWith('test-party-');
			})
			.map((p: any) => {
				// 確保 raid_mode/run_type 為 number（有時候來自表單/URL 是字串）
				if (p.raid_mode !== undefined && p.raid_mode !== null) p.raid_mode = Number(p.raid_mode);
				if (p.run_type !== undefined && p.run_type !== null) p.run_type = Number(p.run_type);

				// 確保 members 的 position 欄位一致
				if (Array.isArray(p.members)) {
					p.members = p.members.map((m: any) => ({
						...m,
						position: (m.position || m.position_type || '').toString()
					}));
				}

				return p;
			});
	});

	// 自動建立預設團隊功能已移除

	// 訂閱 party 表的即時變更（INSERT/UPDATE/DELETE）以即時更新列表
	onMount(() => {
		// 保持非 async 的 onMount 回呼；使用內部 async IIFE 做異步初始工作
		let presenceInstance: any = null;
		let presenceInterval: any = null;

		(async () => {
			partiesChannel = supabase.channel('public:party');

			partiesChannel
				.on(
					'postgres_changes',
					{ event: 'INSERT', schema: 'public', table: 'party' },
					(payload: any) => {
						const p = payload.new;
						if (!p || !p.id) return;
						if (String(p.id).startsWith('test-party-')) return; // 跳過測試資料
						// prepend new party
						parties = [p, ...parties];
					}
				)
				.on(
					'postgres_changes',
					{ event: 'UPDATE', schema: 'public', table: 'party' },
					(payload: any) => {
						const p = payload.new;
						if (!p || !p.id) return;
						if (String(p.id).startsWith('test-party-')) return;
						const idx = parties.findIndex((x: any) => x.id === p.id);
						if (idx !== -1) {
							parties[idx] = p;
							parties = [...parties];
						}
					}
				)
				.on(
					'postgres_changes',
					{ event: 'DELETE', schema: 'public', table: 'party' },
					(payload: any) => {
						const p = payload.old;
						if (!p || !p.id) return;
						parties = parties.filter((x: any) => x.id !== p.id);
					}
				)
				.subscribe((status: any) => {
					if (status === 'SUBSCRIBED') console.log('Subscribed to party changes');
				});

			// 取得本地 user id 與 admin 狀態，用於顯示刪除按鈕
			try {
				const {
					data: { session }
				} = await supabase.auth.getSession();
				let token = session?.access_token;
				if (!token) {
					const { data, error } = await supabase.auth.signInAnonymously();
					if (error) throw error;
					token = data.session?.access_token;
				}

				// previously checked admin status here; admin concept removed
				// we keep anonymous/auth flow for API calls
			} catch (err) {
				console.warn('Failed to load user info', err);
			}

			// 若需要初始化 presence，可在這裡建立並保存 instance
			// (例如：joinPresence)
			// presenceInstance = joinPresence(...)
			// presenceInterval = setInterval(() => { ... }, 2000);
		})();

		// onMount 必須同步回傳 cleanup 函數而非 Promise
		return () => {
			try {
				// 明確檢查並呼叫 unsubscribe
				if (typeof unsubscribe === 'function') unsubscribe();
			} catch (e) {
				console.warn('Error during unsubscribe', e);
			}
			try {
				if (presenceInterval) clearInterval(presenceInterval);
				if (presenceInstance && typeof presenceInstance.leave === 'function')
					presenceInstance.leave();
			} catch (e) {
				console.warn('Error cleaning presence', e);
			}
			if (partiesChannel) supabase.removeChannel(partiesChannel);
		};
	});

	onDestroy(() => {
		if (partiesChannel) supabase.removeChannel(partiesChannel);
	});

	// 使用集中化的 label helpers (`getRaidModeLabel` / `getRunTypeLabel`)

	const formatDate = (iso?: string | null) => {
		if (!iso) return '未設定';
		const d = new Date(iso);
		return d.toLocaleString('zh-TW');
	};

	const getStatusBadge = (status: string) => {
		return getStatusBadgeUtil(status);
	};
</script>

<svelte:head>
	<title>派對列表 | 表單系統</title>
</svelte:head>

<div class="parties-container">
	<!-- 頁面標題（已移除文字） -->
	<div class="page-header"></div>

	<!-- 派對網格 -->
	<div
		class="actions-bar"
		style="display:flex;justify-content:flex-end;margin-bottom:1rem;gap:0.5rem;"
	>
		<!-- 僅保留刷新按鈕（會呼叫後端重置 10 個團隊） -->
		<button
			class="refresh-button"
			onclick={async () => {
				if (
					!confirm(
						'確定要重置所有團隊資料為預設狀態 (10 個團隊，每團 10 個空位)？此操作會刪除現有（非測試）團隊資料，無法復原。'
					)
				)
					return;
				isRefreshing = true;
				try {
					const {
						data: { session }
					} = await supabase.auth.getSession();
					let token = session?.access_token;
					if (!token) {
						const { data, error } = await supabase.auth.signInAnonymously();
						if (error) throw error;
						token = data.session?.access_token;
					}

					const res = await fetch('/api/refresh-ten-parties', {
						method: 'POST',
						headers: { Authorization: `Bearer ${token}` }
					});
					if (!res.ok) {
						const body = await res.text().catch(() => null);
						throw new Error(`Refresh failed: ${res.status} ${body ?? ''}`);
					}
					const _json = await res.json().catch(() => null);
					alert('刷新完成');
					location.reload();
				} catch (err) {
					console.error('Refresh teams failed', err);
					alert('刷新失敗，請查看後端日誌');
				} finally {
					isRefreshing = false;
				}
			}}
		>
			{isRefreshing ? '⏳ 重置中…' : '🔄 刷新團隊'}
		</button>
	</div>
	{#if parties.length > 0}
		<div class="parties-grid">
			{#each parties.slice(0, 10) as party, i (party.id)}
				<div class="party-card-wrap" style="position:relative;">
					<a href="/party/{party.id}" class="party-card">
						<div class="card-header">
							<h2 class="card-title">團隊 {i + 1}</h2>
							<div class="status-badge {getStatusBadge(party.status).color}">
								{getStatusBadge(party.status).label}
							</div>
						</div>

						<div class="card-meta">
							<div class="meta-item">
								<span class="meta-label">難度</span>
								<span class="meta-value">{getRaidModeLabel(party.raid_mode)}</span>
							</div>
							<div class="meta-item">
								<span class="meta-label">類型</span>
								<span class="meta-value">{getRunTypeLabel(party.run_type)}</span>
							</div>
							<div class="meta-item">
								<span class="meta-label">人數</span>
								<span class="meta-value">{party.current_players}/{party.max_players}</span>
							</div>
						</div>

						{#if party.start_at}
							<div class="date-display">
								<span class="date-icon">📅</span>
								<span class="date-text">{formatDate(party.start_at)}</span>
							</div>
						{/if}

						{#if party.note}
							<p class="card-note">{party.note}</p>
						{/if}

						<!-- 成員列表 -->
						{#if party.members && party.members.length > 0}
							<div class="members-section">
								<div class="members-label">隊員</div>
								<div class="members-list">
									{#each party.members.slice(0, 10) as member (member.id)}
										<div class="member-tag {getPositionColor(member.position)}">
											<span class="member-name">{member.name}</span>
											<!-- 職業文字已移除：顏色即可代表職業 -->
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- 建立時間與右側箭頭已移除，如需恢復請回復此區塊 -->
					</a>
					<!-- 已移除刪除按鈕 -->
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<div class="empty-icon">📭</div>
			<h2 class="empty-title">目前沒有派對</h2>
			<p class="empty-text">目前沒有可加入的派對。</p>
		</div>
	{/if}
</div>

<style>
	.parties-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 2.25rem;
		font-weight: 800;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

	:global(.dark) .page-subtitle {
		color: #cbd5e1;
	}

	.parties-grid {
		display: grid;
		/* 固定為每排 5 個（每欄 240px），並以整體置中顯示；小螢幕由 media query 處理 */
		grid-template-columns: repeat(5, 240px);
		gap: 1.5rem;
		margin-bottom: 3rem;
		justify-content: center;
		justify-items: center;
	}

	.party-card {
		min-width: 250px;
		display: flex;
		flex-direction: column;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 1rem;
		text-decoration: none;
		color: inherit;
		transition: all 0.3s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		position: relative;
		overflow: hidden;
	}

	:global(.dark) .party-card {
		background: #1e293b;
		border-color: #334155;
	}

	.party-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.party-card:hover {
		border-color: #667eea;
		box-shadow: 0 8px 16px rgba(102, 126, 234, 0.15);
		transform: translateY(-4px);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
		flex: 1;
	}

	:global(.dark) .card-title {
		color: #f1f5f9;
	}

	.status-badge {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.card-meta {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		border-bottom: none;
	}

	:global(.dark) .card-meta {
		border-color: #334155;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	:global(.dark) .meta-label {
		color: #64748b;
	}

	.meta-value {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #1e293b;
	}

	:global(.dark) .meta-value {
		color: #f1f5f9;
	}

	.card-note {
		font-size: 0.875rem;
		color: #475569;
		margin: 0 0 1rem 0;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.dark) .card-note {
		color: #cbd5e1;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
	}

	.date-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.action-icon {
		font-size: 1.5rem;
		color: #667eea;
		transition: transform 0.2s;
	}

	.party-card:hover .action-icon {
		transform: translateX(4px);
	}

	.members-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-top: none;
	}

	:global(.dark) .members-section {
		border-color: #334155;
	}

	.members-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	:global(.dark) .members-label {
		color: #64748b;
	}

	.members-list {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.member-tag {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		border-radius: 6px;
		font-size: 0.6875rem;
		font-weight: 500;
		text-align: center;
	}

	.member-name {
		font-weight: 600;
		display: -webkit-box;
		line-clamp: 1;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-word;
	}

	.member-position {
		opacity: 0.85;
		font-size: 0.625rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

	:global(.dark) .empty-title {
		color: #f1f5f9;
	}

	.empty-text {
		color: #64748b;
		margin: 0 0 1.5rem 0;
		max-width: 400px;
	}

	:global(.dark) .empty-text {
		color: #cbd5e1;
	}

	.create-button {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.2s;
	}

	.create-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
	}

	@media (max-width: 768px) {
		.parties-grid {
			grid-template-columns: 1fr;
		}

		.page-title {
			font-size: 1.75rem;
		}

		.card-meta {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 1400px) {
		.parties-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (max-width: 1100px) {
		.parties-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 900px) {
		.parties-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
