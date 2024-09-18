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
  :global(.empty.empty.empty) {
    --notice-hs: 214.29deg, 20%;
    --response-color: var(--notice-hs); // Standaard response kleur voor notice
    background-color: hsl(var(--response-color), 98%);
    color: hsl(var(--response-color), 50%);
    border: 1px dashed hsl(var(--response-color), 75%);
    padding: 20px;
    border-radius: 5px;
    padding: 20px;
    text-align: center;
    display: none;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px 5px;
    font-size: 1.4rem;
    line-height: 1.5;
    min-height: 40px;
    box-sizing: border-box;
  }
</style>
