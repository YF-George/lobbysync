<script lang="ts">
	import { getRaidModeLabel, getRunTypeLabel, getStatusBadge } from '$lib/constants/labels';

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

	const statusInfo = $derived(getStatusBadge(party.status));
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
		class="w-full cursor-pointer rounded-lg border-2 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md"
		{onclick}
		onkeydown={handleKeydown}
	>
		<div class="mb-3 flex items-start justify-between">
			<div class="flex-1">
				<h3 class="mb-1 line-clamp-1 text-lg font-bold text-gray-900">
					{party.name}
				</h3>
				<div class="flex items-center gap-2 text-sm">
					<span class="rounded px-2 py-0.5 {statusInfo.color} font-medium">
						{statusInfo.label}
					</span>
					<span class="text-gray-600">
						{getRaidModeLabel(party.raid_mode)} · {getRunTypeLabel(party.run_type)}
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
			<div class="mb-3 grid grid-cols-2 gap-3 text-sm">
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
				<div class="mt-3 border-t border-gray-100 pt-3">
					<div class="mb-1 text-xs text-gray-500">備註</div>
					<p class="line-clamp-2 text-sm text-gray-700">{party.note}</p>
				</div>
			{/if}
		{/if}

		<div
			class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400"
		>
			<span>建立於 {formatDate(party.created_at)}</span>
			<span>更新於 {formatDate(party.updated_at)}</span>
		</div>
	</button>
{:else}
	<div class="rounded-lg border-2 bg-white p-5 shadow-sm">
		<div class="mb-3 flex items-start justify-between">
			<div class="flex-1">
				<h3 class="mb-1 line-clamp-1 text-lg font-bold text-gray-900">
					{party.name}
				</h3>
				<div class="flex items-center gap-2 text-sm">
					<span class="rounded px-2 py-0.5 {statusInfo.color} font-medium">
						{statusInfo.label}
					</span>
					<span class="text-gray-600">
						{getRaidModeLabel(party.raid_mode)} · {getRunTypeLabel(party.run_type)}
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
			<div class="mb-3 grid grid-cols-2 gap-3 text-sm">
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
				<div class="mt-3 border-t border-gray-100 pt-3">
					<div class="mb-1 text-xs text-gray-500">備註</div>
					<p class="line-clamp-2 text-sm text-gray-700">{party.note}</p>
				</div>
			{/if}
		{/if}

		<div
			class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400"
		>
			<span>建立於 {formatDate(party.created_at)}</span>
			<span>更新於 {formatDate(party.updated_at)}</span>
		</div>
	</div>
{/if}
