<script lang="ts">
	import "./layout.css";
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	
	// `data` not used in this layout; removed unused export
</script>

{#key $page.url.pathname}
	<div in:fade={{ duration: 300, delay: 300 }} out:fade={{ duration: 300 }}>
		<slot />
	</div>
{/key}