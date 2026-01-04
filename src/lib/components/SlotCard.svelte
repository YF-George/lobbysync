<script lang="ts">
	interface Slot {
		id: string;
		raid_id: string;
		slot_order: number;
		position_type: string;
		user_id: number | null;
		display_name: string | null;
		gear_score: number;
		status: string;
		tags: string[] | null;
		note: string | null;
		updated_at: string;
	}

	export let slot: Slot;
	export let editable: boolean = false;
	export let onUpdate: ((changes: Partial<Slot>) => void) | undefined;

	const positionConfig: Record<
		string,
		{ icon: string; color: string; label: string; borderColor: string }
	> = {
		tank: {
			icon: '🛡️',
			color: 'bg-blue-50 dark:bg-blue-900/20',
			label: '坦克',
			borderColor: 'border-blue-500'
		},
		heal: {
			icon: '💚',
			color: 'bg-green-50 dark:bg-green-900/20',
			label: '補師',
			borderColor: 'border-green-500'
		},
		dps: {
			icon: '⚔️',
			color: 'bg-red-50 dark:bg-red-900/20',
			label: '輸出',
			borderColor: 'border-red-500'
		}
	};

	// 目前只保留實際使用到的標籤：`leader`。
	const tagLabels: Record<string, { label: string; color: string }> = {
		leader: {
			label: '🎖️ 隊長',
			color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
		}
	};

	const statusLabels: Record<string, { label: string; color: string }> = {
		open: { label: '空位', color: 'text-gray-500 dark:text-gray-400' },
		reserved: { label: '預約', color: 'text-yellow-600 dark:text-yellow-500' },
		filled: { label: '已填', color: 'text-green-600 dark:text-green-500' },
		locked: { label: '鎖定', color: 'text-red-600 dark:text-red-500' }
	};

	function handleUpdate(field: string, value: any) {
		if (!editable || !onUpdate) return;
		onUpdate({ [field]: value });
	}

	function toggleTag(tag: string) {
		if (!editable || !onUpdate) return;

		const tags = slot.tags || [];
		const newTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];

		onUpdate({ tags: newTags });
	}

	$: posInfo = positionConfig[slot?.position_type] ?? positionConfig.dps;
	$: statusInfo = statusLabels[slot?.status] ?? statusLabels.open;
	$: isEmpty = !slot?.display_name || slot.display_name.trim() === '';
</script>

<div
	class={`rounded-lg border-2 p-4 ${
		slot.position_type === 'tank'
			? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
			: slot.position_type === 'heal'
				? 'border-green-500 bg-green-50 dark:bg-green-900/20'
				: 'border-red-500 bg-red-50 dark:bg-red-900/20'
	} dark:border-opacity-60 bg-white/50 backdrop-blur-sm transition-all hover:shadow-md`}
>
	<div class="mb-3 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<span class="text-lg">{posInfo.icon}</span>
			<div class="text-xs font-semibold text-gray-600 dark:text-slate-400">
				位置 {slot.slot_order + 1}
			</div>
		</div>
		<div class={`text-xs font-medium ${statusInfo.color}`}>
			{statusInfo.label}
		</div>
	</div>

	{#if editable}
		<select
			value={slot.position_type}
			onchange={(e) => handleUpdate('position_type', e.currentTarget.value)}
			class="mb-3 w-full rounded border border-gray-200 bg-white p-2 text-sm font-medium transition-all hover:border-blue-400 focus:border-transparent focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
		>
			<option value="tank">{positionConfig.tank.icon} {positionConfig.tank.label}</option>
			<option value="heal">{positionConfig.heal.icon} {positionConfig.heal.label}</option>
			<option value="dps">{positionConfig.dps.icon} {positionConfig.dps.label}</option>
		</select>
	{:else}
		<div
			class="mb-3 rounded bg-white/70 p-2 text-center text-sm font-semibold dark:bg-slate-900/50 dark:text-slate-200"
		>
			{posInfo.label}
		</div>
	{/if}

	<div class="mb-3">
		{#if editable}
			<input
				type="text"
				value={slot.display_name || ''}
				placeholder="輸入角色名稱"
				onblur={(e) => handleUpdate('display_name', e.currentTarget.value)}
				class="w-full rounded border border-gray-200 bg-white p-2 text-sm font-medium transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-600"
			/>
		{:else}
			<div
				class={`rounded bg-white/70 p-2 text-center text-sm font-bold dark:bg-slate-900/50 ${
					isEmpty ? 'text-gray-400 italic dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'
				}`}
			>
				{slot.display_name || '(空位)'}
			</div>
		{/if}
	</div>

	<div class="mb-3">
		{#if editable}
			<div class="relative">
				<input
					type="number"
					value={slot.gear_score || 0}
					placeholder="裝分"
					min="0"
					onblur={(e) => handleUpdate('gear_score', Number(e.currentTarget.value))}
					class="w-full rounded border border-gray-200 bg-white p-2 pl-8 text-sm font-bold transition-all focus:border-transparent focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
				/>
				<span class="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-gray-400">⚡</span>
			</div>
		{:else}
			<div class="rounded bg-white/70 p-2 text-center dark:bg-slate-900/50">
				<div class="text-xs text-gray-500 dark:text-slate-400">裝分</div>
				<div class="text-xl font-bold text-gray-900 dark:text-slate-100">{slot.gear_score}</div>
			</div>
		{/if}
	</div>

	{#if editable}
		<div class="mt-3 border-t border-gray-200 pt-3 dark:border-slate-700">
			<div class="mb-2 text-xs font-medium text-gray-600 dark:text-slate-400">標籤</div>
			<div class="space-y-1">
				{#each Object.entries(tagLabels) as [tag, tagInfo] (tag)}
					<label
						class="flex cursor-pointer items-center rounded px-2 py-1 text-xs transition-colors hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-700/50"
					>
						<input
							type="checkbox"
							checked={slot.tags?.includes(tag) || false}
							onchange={() => toggleTag(tag)}
							class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-800"
						/>
						<span>{tagInfo.label}</span>
					</label>
				{/each}
			</div>
		</div>
	{:else if slot.tags && slot.tags.length > 0}
		<div class="mt-3 border-t border-gray-200 pt-3 dark:border-slate-700">
			<div class="flex flex-wrap gap-1">
				{#each slot.tags as tag (tag)}
					{@const tagInfo = tagLabels[tag]}
					{#if tagInfo}
						<span class={`px-2 py-1 text-xs ${tagInfo.color} rounded-full font-medium`}>
							{tagInfo.label}
						</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	{#if editable}
		<div class="mt-3 border-t border-gray-200 pt-3 dark:border-slate-700">
			<textarea
				value={slot.note || ''}
				placeholder="備註（選填）"
				onblur={(e) => handleUpdate('note', e.currentTarget.value)}
				class="w-full resize-none rounded border border-gray-200 bg-white p-2 text-xs transition-all focus:border-transparent focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
				rows="2"
			></textarea>
		</div>
	{:else if slot.note}
		<div class="mt-3 border-t border-gray-200 pt-3 dark:border-slate-700">
			<div class="mb-1 text-xs text-gray-500 dark:text-slate-400">備註</div>
			<p class="text-xs whitespace-pre-wrap text-gray-700 dark:text-slate-300">{slot.note}</p>
		</div>
	{/if}

	{#if !editable && slot.updated_at}
		<div class="mt-2 text-center text-xs text-gray-400 dark:text-slate-500">
			更新於 {new Date(slot.updated_at).toLocaleTimeString('zh-TW', {
				hour: '2-digit',
				minute: '2-digit'
			})}
		</div>
	{/if}
</div>
