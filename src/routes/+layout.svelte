<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { store } from "$lib/store.svelte";

  let { children } = $props();

  onMount(async () => {
    await store.load();
  });
</script>

<div class="app">
  <nav>
    <span class="brand">Locker Manager</span>
    <div class="nav-links">
      <a href="/" class:active={page.url.pathname === "/"}>Lockers</a>
      <a href="/settings" class:active={page.url.pathname === "/settings"}>
        Settings
      </a>
      <a href="/events" class:active={page.url.pathname === "/events"}>
        Events
      </a>
    </div>
  </nav>

  <main>
    {@render children()}
  </main>
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family:
      Inter,
      system-ui,
      -apple-system,
      sans-serif;
    background: #f1f5f9;
    color: #1e293b;
  }

  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  nav {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 2.5rem 1.5rem;
    height: 52px;
    background: #ff0000;
    color: white;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .brand {
    font-weight: 500;
    font-size: 2rem;
    letter-spacing: 0.08em;
    color: white;
  }

  .nav-links {
    display: flex;
    gap: 0.25rem;
  }

  .nav-links a {
    color: #94a3b8;
    text-decoration: none;
    padding: 0.375rem 0.875rem;
    border-radius: 6px;
    font-size: 0.875rem;
    transition:
      color 0.15s,
      background 0.15s;
  }

  .nav-links a:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }

  .nav-links a.active {
    color: white;
    background: rgba(255, 255, 255, 0.15);
  }

  main {
    flex: 1;
    padding: 1.5rem 2rem;
  }
</style>
