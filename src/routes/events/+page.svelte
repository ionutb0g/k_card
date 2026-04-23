<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { save } from "@tauri-apps/plugin-dialog";
  import { invoke } from "@tauri-apps/api/core";

  let events = $derived([...store.data.events].reverse());

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }

  function buildCsv(): string {
    const rows = [["Time", "Locker", "Action", "QR Code"]];
    for (const e of store.data.events) {
      rows.push([
        new Date(e.timestamp).toLocaleString(),
        `#${e.lockerId}`,
        e.type === "assigned" ? "Key given" : "Key returned",
        e.qrCode ?? "",
      ]);
    }
    return rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\r\n");
  }

  async function handleExport() {
    const path = await save({
      title: "Export Events",
      defaultPath: `events_${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (!path) return;
    await invoke("write_file", { path, content: buildCsv() });
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>Events</h1>
    {#if store.data.events.length > 0}
      <button class="btn export" onclick={handleExport}>Export CSV</button>
    {/if}
  </div>

  {#if events.length === 0}
    <p class="empty">No events recorded yet.</p>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Locker</th>
            <th>Action</th>
            <th>QR Code</th>
          </tr>
        </thead>
        <tbody>
          {#each events as event (event.id)}
            <tr>
              <td class="time">{formatDate(event.timestamp)}</td>
              <td class="locker-id">{event.lockerLabel}</td>
              <td>
                <span class="badge {event.type}">
                  {event.type === "assigned" ? "Key given" : "Key returned"}
                </span>
              </td>
              <td class="qr">{event.qrCode ?? "—"}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 900px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
  }

  .btn.export {
    padding: 0.5rem 1rem;
    background: #1e293b;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn.export:hover {
    background: #334155;
  }

  .empty {
    text-align: center;
    color: #64748b;
    margin-top: 4rem;
  }

  .table-wrap {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    text-align: left;
    padding: 0.875rem 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  td {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    color: #374151;
    border-bottom: 1px solid #f1f5f9;
  }

  tr:last-child td {
    border-bottom: none;
  }

  .time {
    color: #64748b;
    white-space: nowrap;
  }

  .locker-id {
    font-weight: 700;
    color: #1e293b;
  }

  .qr {
    font-family: monospace;
    font-size: 0.8rem;
    color: #475569;
  }

  .badge {
    padding: 0.2rem 0.625rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .badge.assigned {
    background: #fee2e2;
    color: #b91c1c;
  }

  .badge.freed {
    background: #dcfce7;
    color: #15803d;
  }
</style>
