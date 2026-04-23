<script lang="ts">
  import { store } from "$lib/store.svelte";
  import type { Locker } from "$lib/types";

  let inputCount = $state(store.data.settings.lockerCount);
  let saving = $state(false);
  let saved = $state(false);

  let inputPattern = $state(store.data.settings.qrPattern);
  let savingPattern = $state(false);
  let savedPattern = $state(false);

  $effect(() => {
    inputCount = store.data.settings.lockerCount;
  });

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

  let removedInUse = $derived(
    inputCount >= store.data.lockers.length
      ? 0
      : store.data.lockers
          .slice(inputCount)
          .filter((l: Locker) => l.status === "in-use").length,
  );

  async function handleSave() {
    const count = Math.max(0, Math.floor(Number(inputCount)));
    saving = true;
    await store.setLockerCount(count);
    saving = false;
    saved = true;
    setTimeout(() => (saved = false), 2000);
  }

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

  <div class="card">
    <h2>Locker Configuration</h2>

    <div class="field">
      <label for="count">Number of lockers</label>
      <input
        id="count"
        type="number"
        min="0"
        max="500"
        bind:value={inputCount}
      />
    </div>

    {#if removedInUse > 0}
      <div class="warning">
        ⚠ Reducing the count will remove {removedInUse} in-use locker{removedInUse ===
        1
          ? ""
          : "s"} from the end.
      </div>
    {/if}

    <div class="actions">
      <button class="btn primary" onclick={handleSave} disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved!" : "Apply"}
      </button>
    </div>
  </div>

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
        {savingPattern ? "Saving…" : savedPattern ? "Saved!" : "Apply"}
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
    margin-bottom: 1.5rem;
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

  input[type="number"] {
    width: 120px;
    padding: 0.5rem 0.75rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.15s;
  }

  input[type="number"]:focus {
    border-color: #3b82f6;
  }

  input[type="text"] {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: monospace;
    outline: none;
    transition: border-color 0.15s;
  }

  input[type="text"]:focus {
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

  .warning {
    padding: 0.75rem 1rem;
    background: #fef3c7;
    color: #92400e;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
  }

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
    transition:
      background 0.15s,
      opacity 0.15s;
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
</style>
