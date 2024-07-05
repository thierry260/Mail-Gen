<script>
  import Sidebar from "$lib/components/sidebar/Sidebar.svelte";
</script>

<div class="layout">
  <aside class="sidebar">
    <Sidebar />
  </aside>
  <main>
    <slot />
  </main>
</div>

<style>
  .layout {
    display: flex;
    height: 100vh;
    height: 100dvh;
  }
  .sidebar {
    width: 100%;
    max-width: 350px;
    background-color: #f4f4f4;
    height: 100%;
    padding: 20px;
  }
  main {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
</style>
