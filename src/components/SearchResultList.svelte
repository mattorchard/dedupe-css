<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { SearchResult } from 'src/helpers/domainTypes';
	export let searchResults: SearchResult[];
	export let query: string;
</script>

{#key searchResults}
	<ol transition:slide>
		{#each searchResults as result}
			<li>{result.property}: {result.value}</li>
		{/each}
	</ol>
{/key}

{#if searchResults.length === 0}
	<p>No search results found for "{query}"</p>
{/if}

<style>
	ol {
		list-style: none;
		font-family: monospace;
	}
</style>
