<script lang="ts">
	import { fade } from 'svelte/transition';

	import { workerManager } from '../workers/workerManager';
	import { findCssFiles, handleAsStream } from '../helpers/fileHelpers';
	import type { Result } from '../helpers/domainTypes';
	import ResultTable from '../components/ResultTable.svelte';
	import { getDirectoryTree, type PathNode } from '../helpers/folderHelper';
	import DirectoryPreview from '../components/DirectoryPreview.svelte';

	let isLoading = false;
	let results: Result[] | null = null;
	let directoryNode: PathNode | null = null;
	let cssFiles: FileSystemFileHandle[] | null = null;

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
	<section class="panel input-section">
		<h1>
			CSS<br />
			Duplicate<br />
			Finder
		</h1>
		<button class="hero-button" type="button" on:click={handleClick} disabled={isLoading}>
			{isLoading ? 'Loading' : 'Choose Folder'}
		</button>
		<p>Choose a folder to scan for duplicated values in css files</p>
	</section>

	{#if directoryNode}
		<section class="panel" transition:fade>
			<h2>{cssFiles?.length ?? 0} Scanned Files</h2>
			<DirectoryPreview node={directoryNode} />
		</section>
	{/if}

	{#if results}
		<section class="panel" transition:fade>
			<h2>{results.length} Duplicates Found</h2>
			<ResultTable {results} />
		</section>
	{/if}
</main>

<style>
	main {
		display: grid;
		grid-template-columns: 20rem auto auto;
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
	h1,
	h2 {
		font-size: 3rem;
		margin-bottom: 1rem;
	}
	.hero-button {
		font-size: 2rem;
		background-color: var(--cta-color);
		color: var(--text-color);
		padding: 0.5rem 0.5rem;
		border-radius: 0.125rem;
	}
	.hero-button:disabled {
		cursor: not-allowed;
	}
	p {
		margin-top: 1rem;
	}
	.input-section {
		display: flex;
		flex-direction: column;
	}
</style>
