<script lang="ts">
	import type { PathNode } from '../helpers/folderHelper';

	export let node: PathNode;
</script>

{#if node.children.length > 0}
	<div class="folder">{node.name}</div>
	<ul>
		{#each node.children as child}
			<li>
				<svelte:self node={child} />
			</li>
		{/each}
	</ul>
{:else}
	<div class="file">{node.name}</div>
{/if}

<style>
	ul {
		padding-left: 0.5rem;
		list-style: none;
	}
	.folder {
		margin: 0.25rem 0;
	}
	.file::before {
		content: '› ';
	}
</style>
