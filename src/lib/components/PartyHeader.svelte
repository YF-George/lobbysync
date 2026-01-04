<script lang="ts">
	import { getRaidModeLabel, getRunTypeLabel, getStatusBadge } from '$lib/constants/labels';

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

	const statusInfo = $derived(getStatusBadge(party.status));
	const progressPercent = $derived(
		party.max_players > 0 ? Math.round((party.current_players / party.max_players) * 100) : 0
	);
</script>

<div class="overflow-hidden rounded-lg border-2 bg-white shadow-md">
	<!-- 標題區 -->
	<div class="bg-linear-to-r from-blue-600 to-blue-700 p-5 text-white">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h2 class="mb-2 text-2xl font-bold">{party.name}</h2>
				<div class="flex items-center gap-2 text-sm opacity-90">
					<span class="rounded bg-white/20 px-2 py-1">
						{getRaidModeLabel(party.raid_mode)}
					</span>
					<span class="rounded bg-white/20 px-2 py-1">
						{getRunTypeLabel(party.run_type)}
					</span>
					<span class="px-2 py-1 {statusInfo.color} rounded font-medium text-gray-900">
						{statusInfo.label}
					</span>
				</div>
			</div>

			{#if party.gear_limit > 0}
				<div class="rounded-lg bg-white/10 px-4 py-2 text-right">
					<div class="text-xs opacity-75">裝分門檻</div>
					<div class="text-3xl font-bold">{party.gear_limit}</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- 詳細資訊 -->
	<div class="p-5">
		<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
			<!-- 人數進度 -->
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-600">👥 隊伍人數</span>
					<span class="text-sm font-bold text-gray-900">
						{party.current_players} / {party.max_players}
					</span>
				</div>
				<div class="h-3 w-full overflow-hidden rounded-full bg-gray-200">
					<div
						class="flex h-full items-center justify-center bg-linear-to-r from-blue-500 to-blue-600 text-xs font-bold text-white transition-all duration-300"
						style="width: {progressPercent}%"
					>
						{#if progressPercent > 20}
							{progressPercent}%
						{/if}
					</div>
				</div>
			</div>

			<!-- 開始時間 -->
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="mb-2 text-sm font-medium text-gray-600">🕒 開始時間</div>
				<div class="text-lg font-bold text-gray-900">
					{formatDate(party.start_at)}
				</div>
			</div>
		</div>

		<!-- 備註 -->
		{#if party.note}
			<div class="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
				<div class="mb-1 text-sm font-semibold text-yellow-900">📝 備註</div>
				<p class="text-sm whitespace-pre-wrap text-yellow-800">{party.note}</p>
			</div>
		{/if}

		<!-- Discord Webhook -->
		{#if party.discord_webhook}
			<div class="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
				<div class="flex items-center gap-2">
					<span class="text-sm font-semibold text-indigo-900">💬 Discord 通知已啟用</span>
					{#if editable}
						<button class="text-xs text-indigo-600 underline hover:text-indigo-800">
							編輯 Webhook
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
