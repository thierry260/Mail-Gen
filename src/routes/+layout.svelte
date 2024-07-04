<!-- src/routes/+layout.svelte -->
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
  }
  .sidebar {
    width: 250px;
    background-color: #f4f4f4;
    height: 100%;
  }
  main {
    flex: 1;
    padding: 20px;
  }
</style>
