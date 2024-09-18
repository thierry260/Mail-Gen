<script>
  import { onMount } from "svelte";
  import { auth } from "$lib/firebase";
  import { onAuthStateChanged } from "firebase/auth";
  import { goto } from "$app/navigation";
  import Sidebar from "$lib/components/sidebar/Sidebar.svelte";
  import Header from "$lib/components/header/Header.svelte";

  let user = null;

  onMount(() => {
    onAuthStateChanged(auth, (currentUser) => {
      user = currentUser;
      if (!user) {
        goto("/login");
      }
    });
  });
</script>

<div class="layout">
  <Sidebar />
  <main>
    <slot />
  </main>
</div>

<style lang="scss">
  .layout {
    display: flex;
    height: 100vh;
  }
  main {
    flex: 1;
    padding: 50px;
    overflow-y: auto;
  }

  :global(body main:has(.home) nav:first-child) {
    display: flex;
  }
</style>
