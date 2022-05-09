<script lang="ts">
	export let results: { text: string; count: number }[];
</script>

<table>
	<thead>
		<tr>
			<th>Count</th>
			<th>Value</th>
			<th>Color</th>
		</tr>
	</thead>
	<tbody>
		{#each results as result}
			<tr tabindex="0">
				<td>
					{#if result.count > 10}
						<strong>{result.count}</strong>
					{:else}
						{result.count}
					{/if}
				</td>
				<td>
					<code>
						<pre>
							{result.text}
						</pre>
					</code>
				</td>
				<td>
					<div class="color-preview" style="--color: {result.text}" />
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.color-preview {
		width: 1rem;
		height: 1rem;
		background-color: transparent;
		background-color: var(--color);
		border-radius: 1rem;
		margin: 0 auto;
	}
	th {
		text-align: left;
		font-weight: bold;
		padding: 0.125rem 0.25rem;
	}
	table {
		border-collapse: collapse;
	}
	td:first-child {
		text-align: end;
	}
	td:last-child {
		text-align: center;
	}
	pre {
		white-space: normal;
		padding: 0.125rem 0.5rem;
	}
	tr {
		transition: background-color 0.25s ease-in-out;
	}
	tr > td:first-child {
		border-top-left-radius: 0.125rem;
		border-bottom-left-radius: 0.125rem;
	}
	tr > td:last-child {
		border-top-right-radius: 0.125rem;
		border-bottom-right-radius: 0.125rem;
	}
	tbody > tr:hover,
	tbody > tr:focus {
		background-color: var(--background-color);
	}
</style>
