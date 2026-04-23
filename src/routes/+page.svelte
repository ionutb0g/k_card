<script lang="ts">
  import { store } from "$lib/store.svelte";
  import type { Locker } from "$lib/types";

  let dialog = $state<HTMLDialogElement | undefined>(undefined);
  let qrInput = $state<HTMLInputElement | undefined>(undefined);

  let selectedLocker: Locker | null = $state(null);
  let qrCode = $state("");

  let availableCount = $derived(
    store.data.lockers.filter((l: Locker) => l.status === "available").length,
  );
  let inUseCount = $derived(
    store.data.lockers.filter((l: Locker) => l.status === "in-use").length,
  );

  function openLocker(locker: Locker) {
    selectedLocker =
      store.data.lockers.find((l: Locker) => l.id === locker.id) ?? null;
    qrCode = "";
    dialog?.showModal();
    if (locker.status === "available") {
      setTimeout(() => qrInput?.focus(), 50);
    }
  }

  function closeModal() {
    dialog?.close();
  }

  function handleDialogClose() {
    selectedLocker = null;
    qrCode = "";
  }

  async function handleGiveKey() {
    if (!selectedLocker || !qrCode.trim()) return;
    await store.assignLocker(selectedLocker.id, qrCode.trim());
    closeModal();
  }

  async function handleFreeLocker() {
    if (!selectedLocker) return;
    await store.freeLocker(selectedLocker.id);
    closeModal();
  }

  let qrValid = $derived.by(() => {
    const code = qrCode.trim();
    if (!code) return false;
    try {
      return new RegExp(store.data.settings.qrPattern).test(code);
    } catch {
      return false;
    }
  });

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }
</script>

<div class="page">
  <div class="header">
    <h1>Lockers</h1>
    {#if store.data.lockers.length > 0}
      <div class="summary">
        <span class="badge available">{availableCount} available</span>
        <span class="badge in-use">{inUseCount} in use</span>
      </div>
    {/if}
  </div>

  {#if !store.loaded}
    <p class="empty">Loading…</p>
  {:else if store.data.lockers.length === 0}
    <div class="empty">
      <p>No lockers configured.</p>
      <a href="/settings">Go to Settings →</a>
    </div>
  {:else}
    <div class="grid">
      {#each store.data.lockers as locker (locker.id)}
        <button
          class="locker {locker.status}"
          onclick={() => openLocker(locker)}
          title={locker.status === "in-use"
            ? `In use since ${formatDate(locker.assignedAt ?? "")}`
            : "Available"}
        >
          {locker.id}
        </button>
      {/each}
    </div>
  {/if}
</div>

<dialog bind:this={dialog} onclose={handleDialogClose}>
  {#if selectedLocker}
    <div class="modal-header">
      <h2>Locker #{selectedLocker.id}</h2>
      <button class="close-btn" onclick={closeModal}>×</button>
    </div>

    <div class="modal-body">
      {#if selectedLocker.status === "available"}
        <div class="status-badge available">Available</div>
        <label for="qr-input">Scan QR Code</label>
        <input
          id="qr-input"
          bind:this={qrInput}
          bind:value={qrCode}
          onkeydown={(e) => {
            if (e.key === "Enter" && qrValid) handleGiveKey();
          }}
          placeholder="Scan or type QR code…"
          autocomplete="off"
          class:invalid={qrCode.trim().length > 0 && !qrValid}
        />
        {#if qrCode.trim().length > 0 && !qrValid}
          <span class="qr-error">Code does not match the required format.</span>
        {/if}
      {:else}
        <div class="status-badge in-use">In Use</div>
        <div class="info-row">
          <span class="label">QR Code</span>
          <span class="value">{selectedLocker.assignedQR}</span>
        </div>
        <div class="info-row">
          <span class="label">Since</span>
          <span class="value"
            >{formatDate(selectedLocker.assignedAt ?? "")}</span
          >
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn secondary" onclick={closeModal}>Cancel</button>
      {#if selectedLocker.status === "available"}
        <button
          class="btn primary"
          disabled={!qrValid}
          onclick={handleGiveKey}
        >
          Give Key
        </button>
      {:else}
        <button class="btn danger" onclick={handleFreeLocker}
          >Free Locker</button
        >
      {/if}
    </div>
  {/if}
</dialog>

<style>
  .page {
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
  }

  .summary {
    display: flex;
    gap: 0.5rem;
  }

  .badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .badge.available {
    background: #dcfce7;
    color: #15803d;
  }

  .badge.in-use {
    background: #fee2e2;
    color: #b91c1c;
  }

  .empty {
    text-align: center;
    color: #64748b;
    margin-top: 4rem;
  }

  .empty a {
    display: inline-block;
    margin-top: 0.5rem;
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    gap: 12px;
  }

  .locker {
    aspect-ratio: 1;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
    transition:
      transform 0.1s,
      box-shadow 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .locker:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  .locker:active {
    transform: translateY(0);
  }

  .locker.available {
    background: #22c55e;
  }

  .locker.in-use {
    background: #ef4444;
  }

  /* Dialog */
  dialog {
    border: none;
    border-radius: 14px;
    padding: 0;
    width: 420px;
    max-width: calc(100vw - 2rem);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    /* Explicit centering — separate from transform so animation doesn't conflict */
    position: fixed;
    top: 50%;
    left: 50%;
    margin: 0;
    translate: -50% -50%;
  }

  @keyframes dialog-in {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-6px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes backdrop-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  dialog[open] {
    animation: dialog-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  :global(dialog::backdrop) {
    background: rgba(0, 0, 0, 0.45);
    animation: backdrop-in 0.2s ease-out both;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #94a3b8;
    line-height: 1;
    padding: 0.25rem;
    border-radius: 4px;
    transition: color 0.15s;
  }

  .close-btn:hover {
    color: #475569;
  }

  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    width: fit-content;
  }

  .status-badge.available {
    background: #dcfce7;
    color: #15803d;
  }

  .status-badge.in-use {
    background: #fee2e2;
    color: #b91c1c;
  }

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.15s;
  }

  input:focus {
    border-color: #3b82f6;
  }

  input.invalid {
    border-color: #ef4444;
  }

  .qr-error {
    font-size: 0.8rem;
    color: #dc2626;
  }

  .info-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-row .label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .info-row .value {
    font-size: 0.95rem;
    color: #1e293b;
    font-weight: 500;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
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

  .btn.secondary {
    background: #f1f5f9;
    color: #475569;
  }

  .btn.secondary:hover:not(:disabled) {
    background: #e2e8f0;
  }

  .btn.primary {
    background: #3b82f6;
    color: white;
  }

  .btn.primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn.danger {
    background: #ef4444;
    color: white;
  }

  .btn.danger:hover:not(:disabled) {
    background: #dc2626;
  }
</style>
