<script lang="ts">
	import { untrack } from 'svelte';
	import { store } from '$lib/store.svelte';
	import type { Partition } from '$lib/types';

	// ── Partitions ──────────────────────────────────────────────
	let inputPartitions = $state<Partition[]>([]);
	let savingPartitions = $state(false);
	let savedPartitions = $state(false);

	$effect(() => {
		if (store.loaded) {
			untrack(() => {
				inputPartitions = store.data.settings.partitions.map((p) => ({ ...p }));
			});
		}
	});

	let totalLockers = $derived(
		inputPartitions.reduce((sum, p) => sum + (Number(p.lockerCount) || 0), 0)
	);

	let affectedInUse = $derived.by(() => {
		const newMap = new Map(inputPartitions.map((p) => [p.id, Number(p.lockerCount) || 0]));
		return store.data.lockers.filter((l) => {
			if (l.status !== 'in-use') return false;
			const newCount = newMap.get(l.partitionId);
			return newCount === undefined || l.index > newCount;
		}).length;
	});

	function addPartition() {
		inputPartitions.push({ id: crypto.randomUUID(), name: '', lockerCount: 10 });
	}

	function partitionHasInUse(partitionId: string): boolean {
		return store.data.lockers.some(
			(l) => l.partitionId === partitionId && l.status === 'in-use'
		);
	}

	function removePartition(i: number) {
		inputPartitions.splice(i, 1);
	}

	async function handleApplyPartitions() {
		const valid = inputPartitions
			.filter((p) => p.name.trim() && Number(p.lockerCount) > 0)
			.map((p) => ({ ...p, lockerCount: Math.floor(Number(p.lockerCount)) }));

		if (!valid.length) return;
		savingPartitions = true;
		await store.setPartitions(valid);
		inputPartitions = store.data.settings.partitions.map((p) => ({ ...p }));
		savingPartitions = false;
		savedPartitions = true;
		setTimeout(() => (savedPartitions = false), 2000);
	}

	// ── QR Pattern ───────────────────────────────────────────────
	let inputPattern = $state(store.data.settings.qrPattern);
	let savingPattern = $state(false);
	let savedPattern = $state(false);

	$effect(() => {
		inputPattern = store.data.settings.qrPattern;
	});

	let patternError = $derived.by(() => {
		try {
			new RegExp(inputPattern);
			return null;
		} catch (e) {
			return (e as Error).message;
		}
	});

	async function handleSavePattern() {
		savingPattern = true;
		await store.setQrPattern(inputPattern);
		savingPattern = false;
		savedPattern = true;
		setTimeout(() => (savedPattern = false), 2000);
	}
</script>

<div class="page">
	<h1>Settings</h1>

	<!-- Partitions -->
	<div class="card">
		<h2>Partitions</h2>

		{#if inputPartitions.length > 0}
			<div class="partition-list">
				<div class="partition-header">
					<span>Name</span>
					<span>Lockers</span>
				</div>
				{#each inputPartitions as partition, i (partition.id)}
					<div class="partition-row">
						<input
							type="text"
							bind:value={partition.name}
							placeholder="e.g. A"
							class="name-input"
							maxlength="20"
						/>
						<input
							type="number"
							bind:value={partition.lockerCount}
							min="1"
							max="500"
							class="count-input"
						/>
						<button
							class="remove-btn"
							onclick={() => removePartition(i)}
							disabled={partitionHasInUse(partition.id)}
							title={partitionHasInUse(partition.id) ? 'Free all lockers before removing this partition' : 'Remove partition'}
						>
							✕
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<button class="btn add" onclick={addPartition}>+ Add Partition</button>

		{#if totalLockers > 0}
			<p class="total">Total: <strong>{totalLockers}</strong> lockers</p>
		{/if}

		{#if affectedInUse > 0}
			<div class="warning">
				⚠ {affectedInUse} in-use locker{affectedInUse === 1 ? '' : 's'} will be removed.
			</div>
		{/if}

		<div class="actions">
			<button
				class="btn primary"
				onclick={handleApplyPartitions}
				disabled={savingPartitions || inputPartitions.length === 0}
			>
				{savingPartitions ? 'Saving…' : savedPartitions ? 'Saved!' : 'Apply'}
			</button>
		</div>
	</div>

	<!-- QR Pattern -->
	<div class="card">
		<h2>QR Code Validation</h2>

		<div class="field">
			<label for="pattern">Regex pattern</label>
			<input
				id="pattern"
				type="text"
				class:invalid={!!patternError}
				bind:value={inputPattern}
				placeholder="e.g. ^[A-Z0-9]{8}$"
				spellcheck="false"
			/>
			{#if patternError}
				<span class="field-error">{patternError}</span>
			{:else}
				<span class="field-hint">Scanned codes must match this pattern to enable the Give Key button.</span>
			{/if}
		</div>

		<div class="actions">
			<button
				class="btn primary"
				onclick={handleSavePattern}
				disabled={savingPattern || !!patternError}
			>
				{savingPattern ? 'Saving…' : savedPattern ? 'Saved!' : 'Apply'}
			</button>
		</div>
	</div>
</div>

<style>
	.page {
		max-width: 480px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1e293b;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	h2 {
		font-size: 1rem;
		font-weight: 700;
		color: #1e293b;
	}

	/* Partition list */
	.partition-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.partition-header {
		display: grid;
		grid-template-columns: 1fr 100px 32px;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0 0.25rem;
	}

	.partition-row {
		display: grid;
		grid-template-columns: 1fr 100px 32px;
		gap: 0.5rem;
		align-items: center;
	}

	.name-input,
	.count-input {
		padding: 0.5rem 0.75rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 8px;
		font-size: 0.9rem;
		outline: none;
		transition: border-color 0.15s;
		width: 100%;
	}

	.name-input:focus,
	.count-input:focus {
		border-color: #3b82f6;
	}

	.remove-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		color: #94a3b8;
		font-size: 0.8rem;
		transition: background 0.15s, color 0.15s;
	}

	.remove-btn:hover:not(:disabled) {
		background: #fee2e2;
		color: #dc2626;
	}

	.remove-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.total {
		font-size: 0.875rem;
		color: #64748b;
	}

	.warning {
		padding: 0.75rem 1rem;
		background: #fef3c7;
		color: #92400e;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* QR pattern */
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}

	input[type='text'] {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 8px;
		font-size: 0.9rem;
		font-family: monospace;
		outline: none;
		transition: border-color 0.15s;
	}

	input[type='text']:focus {
		border-color: #3b82f6;
	}

	input.invalid {
		border-color: #ef4444;
	}

	.field-error {
		font-size: 0.8rem;
		color: #dc2626;
	}

	.field-hint {
		font-size: 0.8rem;
		color: #64748b;
	}

	/* Shared */
	.actions {
		display: flex;
	}

	.btn {
		padding: 0.5rem 1.25rem;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, opacity 0.15s;
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.btn.primary {
		background: #3b82f6;
		color: white;
	}

	.btn.primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn.add {
		background: #f1f5f9;
		color: #475569;
		align-self: flex-start;
	}

	.btn.add:hover {
		background: #e2e8f0;
	}
</style>
