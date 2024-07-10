<script>
</script>

<div class="layout">
  <main>
    <slot />
  </main>
</div>

<style>
  .layout {
    display: flex;
    height: 100vh;
  }
  main {
    flex: 1;
    padding: 50px;
    overflow-y: auto;
  }
</style>
