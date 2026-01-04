<script lang="ts">
	import SlotCard from './SlotCard.svelte';

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

	interface Props {
		slots: Slot[];
		editable?: boolean;
		onUpdate?: (slotId: string, changes: Partial<Slot>) => void;
		columns?: number;
	}

	let { slots, editable = false, onUpdate, columns = 5 }: Props = $props();

	function handleSlotUpdate(slotId: string, changes: Partial<Slot>) {
		if (!editable || !onUpdate) return;
		onUpdate(slotId, changes);
	}

	const gridClass = $derived(
		columns === 5
			? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
			: columns === 4
				? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
				: columns === 3
					? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
					: 'grid-cols-1 md:grid-cols-2'
	);
</script>

<div class="grid {gridClass} gap-4">
	{#each slots as slot (slot.id)}
		<SlotCard {slot} {editable} onUpdate={(changes) => handleSlotUpdate(slot.id, changes)} />
	{/each}
</div>
