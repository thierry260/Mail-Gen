<script>
  import Sidebar from "$lib/components/sidebar/Sidebar.svelte";
</script>

<div class="layout">
  <Sidebar />
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
  main {
    flex: 1;
    padding: 50px;
    overflow-y: auto;
  }
</style>
