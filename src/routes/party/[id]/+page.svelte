<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import { supabase } from '$lib/supabaseClient';
	import { subscribeToPartyUpdates } from '$lib/realtime';
	import { POSITION_CONFIG } from '$lib/constants/positions';
	import { RAID_MODE_LABELS, RUN_TYPE_LABELS } from '$lib/constants/labels';

	let { data } = $props<{ data: PageData }>();

	let party = $state<any>(null);
	let slots = $state<any[]>([]);
	let authToken = $state('');
	let isAuthenticated = $state(false);
	let activeTab = $state<'members' | 'history'>('members');
	let changeLogs = $state<any[]>([]);
	let unsubscribe: (() => void) | null = null;

	$effect(() => {
		party = data.party;
		slots = data.slots || [];
	});

	// 保證 raid_mode / run_type 為 number，避免 select 值與 option 類型不一致導致顯示問題
	$effect(() => {
		if (party) {
			if (party.raid_mode !== undefined && party.raid_mode !== null)
				party.raid_mode = Number(party.raid_mode);
			if (party.run_type !== undefined && party.run_type !== null)
				party.run_type = Number(party.run_type);
		}
	});

	onMount(async () => {
		const { data: authData } = await supabase.auth.signInAnonymously();
		if (authData?.session) {
			authToken = authData.session.access_token;
			isAuthenticated = true;
		}
		loadChangeLogs();
		unsubscribe = subscribeToPartyUpdates(
			party.id,
			// 單個 slot 更新回調（用於用戶編輯）
			(updatedSlot) => {
				const index = slots.findIndex((s) => s.id === updatedSlot.id);
				if (index !== -1) {
					// 合併更新，保留本地樂觀更新
					slots[index] = { ...slots[index], ...updatedSlot };
				}
			},
			// Party 更新回調
			(updatedParty) => {
				// 即時同步 party 更新（包括等級等欄位）
				party = { ...party, ...updatedParty };
			},
			// 批量 slots 更新回調（用於 refresh/repair/recreate，一次性更新避免多次重渲染）
			(updatedSlots) => {
				// 建立 slot ID -> slot 的映射以快速查找
				const slotMap = new Map(updatedSlots.map((s: any) => [s.id, s]));
				// 一次性更新所有變更的 slots
				slots = slots.map((s) => {
					const updated = slotMap.get(s.id);
					return updated ? { ...s, ...updated } : s;
				});
			}
		);
	});

	onDestroy(() => unsubscribe?.());

	async function updateSlot(slotId: string, changes: any) {
		if (!isAuthenticated) return;
		const index = slots.findIndex((s) => s.id === slotId);
		if (index === -1) return;
		const oldSlot = { ...slots[index] };
		slots[index] = { ...oldSlot, ...changes };
		try {
			const res = await fetch(`/api/slot/${slotId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
				body: JSON.stringify(changes)
			});
			if (res.ok) {
				const data = await res.json();
				// 如果後端回傳 slot，使用回傳的完整資料更新本地狀態
				if (data && data.slot) slots[index] = data.slot;
			} else {
				// 回滾
				slots[index] = oldSlot;
			}
		} catch (_err) {
			slots[index] = oldSlot;
		}
	}

	async function updateParty(changes: any) {
		if (!isAuthenticated) return;
		if (!party?.id) return;
		const old = { ...party };
		party = { ...party, ...changes };
		try {
			const res = await fetch(`/api/party/${party.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
				body: JSON.stringify(changes)
			});
			if (res.ok) {
				const data = await res.json();
				// 使用後端回傳的 party（若有）來同步本地狀態
				if (data && data.party) {
					party = data.party;
				}
			} else {
				party = old;
			}
		} catch (_err) {
			party = old;
		}
	}

	async function loadChangeLogs() {
		if (!party?.id) return;
		const res = await fetch(`/api/changelog/${party.id}`);
		if (res.ok) {
			const data = await res.json();
			changeLogs = data.logs || [];
		}
	}
</script>

<div class="font-sanstext-slate-900 dark:text-slate-100">
	<header class="sticky top-0 z-30 max-w-350 px-6">
		<div class="flex max-w-350 items-center justify-between py-5">
			<div class="flex items-center gap-4">
				<a href="/parties" class="rounded-lg p-2 transition-colors" aria-label="返回列表">
					<svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</a>
				<div>
					<h1 class="text-2xl font-black text-slate-900 dark:text-white">
						{party?.name || '團隊管理'}
					</h1>
				</div>
			</div>
			<!-- 已移除右側的編制顯示（party current/max players） -->
		</div>
	</header>

	<main class="mx-auto max-w-350 px-6">
		<!-- 團隊設定表單 -->
		<div
			class="party-settings mb-6 flex flex-row flex-wrap items-end gap-4 rounded-xl border-slate-700/40 bg-slate-100 p-4 dark:border-slate-700/40 dark:bg-slate-800/40"
		>
			<div class="w-full space-y-2 sm:w-72">
				<label for="party-name" class="text-xs font-bold">副本名稱</label>
				<input
					id="party-name"
					type="text"
					value={party?.name || ''}
					onblur={(e) => updateParty({ name: e.currentTarget.value })}
					class="w-full rounded-xl border-2 px-3 py-2 text-sm"
				/>
			</div>

			<div class="w-full space-y-2 sm:w-56">
				<label for="party-start-at" class="text-xs font-bold">日期時間</label>
				<input
					id="party-start-at"
					type="datetime-local"
					value={party?.start_at ? new Date(party.start_at).toISOString().slice(0, 16) : ''}
					onchange={(e) =>
						updateParty({
							start_at: e.currentTarget.value ? new Date(e.currentTarget.value).toISOString() : null
						})}
					class="w-full rounded-xl border-2 px-3 py-2 text-sm"
				/>
			</div>

			<div class="w-full space-y-2 sm:w-40">
				<label for="party-status" class="text-xs font-bold">團隊狀態</label>
				<select
					id="party-status"
					value={party?.status}
					onchange={(e) => updateParty({ status: e.currentTarget.value })}
					class="w-full rounded-xl border-2 px-3 py-2 text-sm"
				>
					<option value="recruiting">招募中</option>
					<option value="ready">已準備</option>
					<option value="finished">已出團</option>
				</select>
			</div>

			<div class="w-full space-y-2 sm:w-40">
				<label for="party-raid-mode" class="text-xs font-bold">副本模式</label>
				<select
					id="party-raid-mode"
					value={String(party?.raid_mode ?? '')}
					onchange={(e) => updateParty({ raid_mode: parseInt(e.currentTarget.value) })}
					class="w-full rounded-xl border-2 px-3 py-2 text-sm"
				>
					{#each Object.entries(RAID_MODE_LABELS) as [key, label] (key)}
						<option value={key}>{label}</option>
					{/each}
				</select>
			</div>

			<div class="w-full space-y-2 sm:w-32">
				<label for="party-gear-limit" class="text-xs font-bold">裝分限制</label>
				<input
					id="party-gear-limit"
					type="number"
					value={party?.gear_limit || 0}
					onblur={(e) => updateParty({ gear_limit: parseInt(e.currentTarget.value) || 0 })}
					class="w-full rounded-xl border-2 px-3 py-2 text-sm"
				/>
			</div>

			<div class="w-full space-y-2 sm:w-32">
				<label for="party-run-type" class="text-xs font-bold">種類</label>
				<select
					id="party-run-type"
					value={String(party?.run_type ?? '')}
					onchange={(e) => updateParty({ run_type: parseInt(e.currentTarget.value) })}
					class="w-full rounded-xl border-2 px-3 py-2 text-sm"
				>
					{#each Object.entries(RUN_TYPE_LABELS) as [key, label] (key)}
						<option value={key}>{label}</option>
					{/each}
				</select>
			</div>

			<div class="w-full space-y-2 sm:w-28">
				<label for="party-level-slot" class="text-xs font-bold">等級</label>
				<input
					id="party-level-slot"
					type="number"
					step="1"
					min="0"
					inputmode="numeric"
					value={party?.level_slot ?? 0}
					onblur={(e) =>
						updateParty({
							level_slot: e.currentTarget.value ? parseInt(e.currentTarget.value) : 0
						})}
					class="w-full rounded-xl border-2 px-3 py-2 text-sm"
				/>
			</div>
		</div>

		<!-- 已移除頁面頂部的標籤按鈕（成員管理 / 變更記錄） -->

		{#if activeTab === 'members'}
			<div class="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
				{#each slots as slot (slot.id)}
					<div class="group relative">
						<div
							class="flex aspect-3/4 flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-indigo-500/70 hover:shadow-indigo-500/20 dark:border-slate-700 dark:bg-linear-to-br dark:from-slate-800 dark:to-slate-900"
						>
							<div
								class="flex items-center gap-2 border-b border-slate-200 bg-white/50 p-2 backdrop-blur dark:border-slate-700 dark:bg-linear-to-br dark:from-slate-800/80 dark:to-slate-900/80"
							>
								<div
									class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-black text-indigo-700 shadow-lg dark:bg-linear-to-br dark:from-indigo-600 dark:to-purple-600 dark:text-white"
								>
									{slot.slot_order + 1}
								</div>
								<button
									type="button"
									onclick={() =>
										updateSlot(slot.id, { role: slot.role === 'leader' ? '' : 'leader' })}
									class={`role-btn leader flex-1 rounded-lg border py-1 text-xs font-bold transition-all ${slot.role === 'leader' ? 'active' : 'inactive'}`}
									aria-label="切換隊長標記"
								>
									{slot.role === 'leader' ? '👑 隊長' : '隊長'}
								</button>
								<button
									type="button"
									onclick={() =>
										updateSlot(slot.id, { role: slot.role === 'helper' ? '' : 'helper' })}
									class={`role-btn helper flex-1 rounded-lg border py-1 text-xs font-bold transition-all ${slot.role === 'helper' ? 'active' : 'inactive'}`}
									aria-label="切換幫打標記"
								>
									{slot.role === 'helper' ? '🤝 幫打' : '幫打'}
								</button>
							</div>

							<div class="flex flex-1 flex-col gap-2 p-3">
								<div class="space-y-2">
									<label
										for="pos-{slot.id}"
										class="ml-1 block text-xs font-black tracking-wider uppercase">職位角色</label
									>
									<select
										id="pos-{slot.id}"
										value={slot.position_type}
										onchange={(e) => updateSlot(slot.id, { position_type: e.currentTarget.value })}
										class={`w-full appearance-none ${POSITION_CONFIG[slot.position_type]?.color || 'bg-slate-700 text-white'} cursor-pointer rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold transition-all outline-none hover:brightness-110 focus:ring-4 focus:ring-indigo-500/30 dark:border-slate-700`}
										aria-label="選擇職位"
									>
										<option value="tank">🛡️ 坦克</option>
										<option value="heal">🌿 補師</option>
										<option value="dps">⚔️ 輸出</option>
									</select>
								</div>

								<div class="space-y-2">
									<label
										for="name-{slot.id}"
										class="ml-1 block text-xs font-black tracking-wider uppercase">玩家暱稱</label
									>
									<input
										id="name-{slot.id}"
										type="text"
										value={slot.display_name || ''}
										placeholder="輸入暱稱..."
										onblur={(e) => updateSlot(slot.id, { display_name: e.currentTarget.value })}
										class="w-full rounded-xl border-2 px-3 py-2.5 text-sm transition-all outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/30"
										aria-label="輸入玩家暱稱"
									/>
								</div>

								<div class="mt-auto border-t border-slate-700/50 pt-3">
									<label
										for="gs-{slot.id}"
										class="mb-2 ml-1 block text-xs font-black tracking-wider uppercase">裝分</label
									>
									<input
										id="gs-{slot.id}"
										type="number"
										value={slot.gear_score || 0}
										onblur={(e) =>
											updateSlot(slot.id, { gear_score: parseInt(e.currentTarget.value) || 0 })}
										class="w-full border-none bg-transparent bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text px-2 py-1 text-center font-mono text-2xl font-bold text-transparent transition-all outline-none focus:from-indigo-300 focus:to-purple-300"
										aria-label="輸入裝備分數"
									/>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-2xl border-2 border-slate-700/50 bg-linear-to-br from-slate-800 to-slate-900 shadow-2xl"
			>
				<div
					class="flex items-center gap-3 border-b border-slate-700/50 bg-linear-to-r from-indigo-600/20 to-purple-600/20 p-5 font-bold"
				>
					<svg
						class="h-5 w-5 text-indigo-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<span class="text-lg">變更記錄</span>
				</div>
				<div class="max-h-150 space-y-3 overflow-y-auto p-5">
					{#if changeLogs.length === 0}
						<div class="py-12 text-center">
							<div class="mb-4 text-6xl">📋</div>
							<p class="text-slate-400">暫無變更記錄</p>
						</div>
					{:else}
						{#each changeLogs as log (log.id ?? log.created_at)}
							<div
								class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 transition-colors hover:border-slate-600/50"
							>
								<div class="mb-2 flex items-start justify-between">
									<span class="text-sm text-slate-300">
										<strong class="font-bold text-indigo-400">{log.actor_name}</strong>
										<span class="text-slate-400">{log.details}</span>
									</span>
									<span class="ml-3 font-mono text-xs whitespace-nowrap text-slate-500 uppercase">
										{new Date(log.created_at).toLocaleTimeString('zh-TW', {
											hour: '2-digit',
											minute: '2-digit'
										})}
									</span>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	/* 優化輸入框樣式 */
	input:focus,
	select:focus {
		outline: none;
	}

	/* 隱藏數字輸入框的微調按鈕 */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type='number'] {
		appearance: textfield;
		-moz-appearance: textfield;
	}

	/* 全局背景色 */
	:global(body) {
		background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
	}

	/* 自定義滾動條 */
	::-webkit-scrollbar {
		width: 10px;
		height: 10px;
	}

	::-webkit-scrollbar-track {
		background: #1e293b;
		border-radius: 10px;
	}

	::-webkit-scrollbar-thumb {
		background: #475569;
		border-radius: 10px;
		border: 2px solid #1e293b;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #64748b;
	}

	/* ===== theme-aware overrides for this page ===== */
	.party-settings label {
		color: #94a3b8;
	}

	:global(.dark) .party-settings label {
		color: #cbd5e1;
	}

	:global(.dark) .party-settings input,
	:global(.dark) .party-settings select {
		background: rgba(15, 23, 42, 0.9) !important;
		color: #f8fafc !important;
		border-color: #334155 !important;
	}

	/* light-mode overrides (force light appearance when .dark is not present) */
	.party-settings input,
	.party-settings select {
		background: #ffffff !important;
		color: #0f172a !important;
		border-color: #e2e8f0 !important;
	}

	.party-settings input::placeholder {
		color: #64748b !important;
	}

	:global(.dark) .party-settings input::placeholder {
		color: #94a3b8 !important;
	}

	/* ===== ensure slot card inputs/selects follow theme ===== */
	/* slot input/select in member cards */
	.group input,
	.group select {
		background: #ffffff !important;
		color: #0f172a !important;
		border-color: #e2e8f0 !important;
	}

	:global(.dark) .group input,
	:global(.dark) .group select {
		background: rgba(15, 23, 42, 0.88) !important;
		color: #f8fafc !important;
		border-color: #334155 !important;
	}

	/* select options color for dark */
	:global(.dark) .group select option {
		background: rgba(15, 23, 42, 0.95) !important;
		color: #f8fafc !important;
	}

	/* make sure placeholder in slot inputs is readable */
	.group input::placeholder {
		color: #64748b !important;
	}
	:global(.dark) .group input::placeholder {
		color: #94a3b8 !important;
	}

	/* slot card labels */
	.ml-1.block.text-xs {
		color: #94a3b8;
	}

	:global(.dark) .ml-1.block.text-xs {
		color: #cbd5e1;
	}

	/* role (leader/helper) buttons theme-aware styles */
	.role-btn {
		min-width: 3.2rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
	}

	.role-btn.inactive {
		border-color: #475569;
		background: rgba(148, 163, 184, 0.06);
		color: #94a3b8;
	}

	:global(.dark) .role-btn.inactive {
		border-color: #334155;
		background: rgba(15, 23, 42, 0.5);
		color: #94a3b8;
	}

	.role-btn.leader.active {
		border-color: rgba(239, 68, 68, 0.7);
		background: linear-gradient(90deg, rgba(239, 68, 68, 0.18), rgba(244, 63, 94, 0.12));
		color: #fecaca;
		box-shadow: 0 12px 30px rgba(239, 68, 68, 0.08);
	}

	:global(.dark) .role-btn.leader.active {
		border-color: rgba(239, 68, 68, 0.8);
		background: linear-gradient(90deg, rgba(220, 38, 38, 0.18), rgba(168, 85, 247, 0.08));
		color: #fff5f5;
		box-shadow: 0 12px 30px rgba(239, 68, 68, 0.14);
	}

	.role-btn.helper.active {
		border-color: rgba(245, 158, 11, 0.75);
		background: linear-gradient(90deg, rgba(245, 158, 11, 0.18), rgba(249, 115, 22, 0.12));
		color: #ffedd5;
		box-shadow: 0 12px 30px rgba(245, 158, 11, 0.08);
	}

	:global(.dark) .role-btn.helper.active {
		border-color: rgba(245, 158, 11, 0.85);
		background: linear-gradient(90deg, rgba(245, 158, 11, 0.18), rgba(249, 115, 22, 0.12));
		color: #fffaf0;
		box-shadow: 0 12px 30px rgba(245, 158, 11, 0.14);
	}
</style>
