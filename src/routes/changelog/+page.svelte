<script lang="ts">
	let changes = [
		{ id: 1, when: '2026-01-03', note: '初始化：建立 10 個測試派對與空白格子' },
		{ id: 2, when: '2026-01-03', note: '移除 slot.tags 欄位' },
		{ id: 3, when: '2026-01-03', note: '在詳細頁增加可編輯派對資料表單' }
	];
</script>

<svelte:head>
	<title>更改紀錄 | 表單系統</title>
</svelte:head>

<section class="prose mx-auto p-6 max-w-4xl">
	<h1>更改紀錄</h1>
	<p>以下為近期變更摘要。</p>
	<ul>
		{#each changes as c}
			<li><strong>{c.when}</strong> — {c.note}</li>
		{/each}
	</ul>
</section>

<style>
	.prose { color: var(--text, #0f172a); }
	:global(.dark) .prose { color: #e6eef8; }
</style>