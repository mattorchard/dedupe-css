<script lang="ts">
	import { fade, slide } from 'svelte/transition';

	import { workerManager } from '../workers/workerManager';
	import { findCssFiles, handleAsStream } from '../helpers/fileHelpers';
	import type { Result, SearchResult } from '../helpers/domainTypes';
	import ResultTable from '../components/ResultTable.svelte';
	import { getDirectoryTree, type PathNode } from '../helpers/folderHelper';
	import DirectoryPreview from '../components/DirectoryPreview.svelte';
	import SearchResultList from '../components/SearchResultList.svelte';

	let isLoading = false;
	let results: Result[] | null = null;
	let directoryNode: PathNode | null = null;
	let cssFiles: FileSystemFileHandle[] | null = null;
	let rawQuery: string = '';
	let searchResults: SearchResult[] | null = null;

	$: cleanedQuery = rawQuery.trim().toLowerCase();

	$: if (cleanedQuery && cssFiles) {
		Promise.all(cssFiles.map(handleAsStream))
			.then((streams) => workerManager.searchCss(cleanedQuery, streams))
			.then((newResults) => (searchResults = newResults));
	}

	const handleClick = async () => {
		try {
			isLoading = true;
			results = null;
			directoryNode = null;
			cssFiles = null;

			const dirHandle = await window.showDirectoryPicker();
			cssFiles = await findCssFiles(dirHandle);

			await Promise.all([
				getDirectoryTree(dirHandle, cssFiles).then((root) => (directoryNode = root)),
				Promise.all(cssFiles.map(handleAsStream))
					.then((streams) => workerManager.parseCss(streams))
					.then((newResults) => (results = newResults))
			]);
		} finally {
			isLoading = false;
		}
	};
</script>

<main>
	<div role="group" class="section-group">
		<section class="panel input-section">
			<h1>
				CSS<br />
				Duplicate<br />
				Finder
			</h1>
			<button
				class="hero-button"
				type="button"
				on:click={handleClick}
				disabled={isLoading}
				data-paused={!!cssFiles}
			>
				{isLoading ? 'Loading' : 'Choose Folder'}
			</button>
			<p>Choose a folder to scan for duplicated values in css files</p>
		</section>

		{#if cssFiles}
			<section class="panel search-section" transition:fade>
				<h2>Search</h2>
				<input
					type="search"
					placeholder="e.g. transform"
					on:change={(e) => (rawQuery = e.currentTarget.value)}
				/>
			</section>
		{/if}
	</div>

	{#if directoryNode}
		<section class="panel" transition:fade>
			<h2>{cssFiles?.length ?? 0} Scanned Files</h2>
			<DirectoryPreview node={directoryNode} />
		</section>
	{/if}

	<div role="group" class="section-group">
		{#if searchResults && rawQuery}
			<section class="panel" transition:slide>
				<h2>{searchResults.length ?? 0} Search Results</h2>
				<SearchResultList {searchResults} query={rawQuery} />
			</section>
		{/if}

		{#if results}
			<section class="panel" transition:fade>
				<h2>{results.length} Duplicates Found</h2>
				<ResultTable {results} />
			</section>
		{/if}
	</div>
</main>

<style>
	main {
		display: grid;
		grid-template-columns: 20rem min-content auto;
		position: relative;
		z-index: 10;
		align-items: flex-start;
		overflow-x: auto;
		min-height: 100vh;
	}
	section {
		padding: 1rem;
		margin: 1rem;
	}
	.section-group {
		display: flex;
		flex-direction: column;
	}
	h1,
	h2 {
		font-size: 3rem;
		margin-bottom: 1rem;
		white-space: nowrap;
	}
	.hero-button {
		font-size: 2rem;
		background-color: var(--cta-color);
		color: var(--text-color);
		padding: 0.5rem 0.5rem;
		border-radius: 0.125rem;
		animation: pulse 5s ease-in-out infinite;
	}

	@keyframes pulse {
		0% {
			filter: brightness(1);
		}
		50% {
			filter: brightness(1.1);
		}
		100% {
			filter: brightness(1);
		}
	}
	.hero-button:disabled {
		cursor: not-allowed;
	}
	.hero-button[data-paused='true'] {
		animation-play-state: paused;
	}
	p {
		margin-top: 1rem;
	}
	.input-section {
		display: flex;
		flex-direction: column;
	}
	input[type='search'] {
		background: none;
		color: var(--text-color);
		background-color: var(--frosted-glass);
		padding: 0.5rem;
		border-radius: 0.125rem;
		width: 100%;
	}
	input[type='search']::-webkit-search-cancel-button {
		appearance: none;
	}
</style>
