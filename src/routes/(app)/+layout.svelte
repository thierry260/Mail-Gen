<script>
  import { onMount } from "svelte";
  import { auth } from "$lib/firebase";
  import { onAuthStateChanged } from "firebase/auth";
  import { goto } from "$app/navigation";
  import Sidebar from "$lib/components/sidebar/Sidebar.svelte";
  import Header from "$lib/components/header/Header.svelte";
  import {
    House,
    ListMagnifyingGlass,
    GearSix,
    EnvelopeSimple,
  } from "phosphor-svelte";

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
  <aside><Sidebar /></aside>
  <main>
    <slot />
  </main>
  <nav class="mobile_nav">
    <label>
      <input type="radio" name="nav" id="search" value="search" checked />
      <div class="icon_outer"><ListMagnifyingGlass size={20} /></div>
      <span>Zoeken</span>
    </label>
    <label>
      <input type="radio" name="nav" id="templates" value="templates" />
      <div class="icon_outer"><EnvelopeSimple size={20} /></div>
      <span>Templates</span>
    </label>
    <label>
      <input type="radio" name="nav" id="settings" value="settings" />
      <div class="icon_outer"><GearSix size={20} /></div>
      <span>Instellingen</span>
    </label>
  </nav>
</div>

<style lang="scss">
  .layout {
    display: flex;
    height: 100vh;
    height: 100dvh;
    grid-template-rows: minmax(0, 1fr) auto;

    @media (max-width: $lg) {
      display: grid;
      overflow: hidden;
      // align-items: flex-start;
      > * {
        grid-column: 1 / -1;
        grid-row: 1;
        transition: transform 0s ease;
      }
      main {
        transform: translateX(100%);
      }
    }

    @media (max-width: $md) {
      > * {
        transition-duration: 0.4s;
      }
    }
  }
  main {
    flex: 1;
    padding: 50px;
    overflow-y: auto;
    @media (max-width: $lg) {
      padding: 30px;
    }
  }

  nav.mobile_nav {
    display: none;
    z-index: 99;
    background-color: #fff;
    align-items: center;
    justify-content: space-around;
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
    grid-row: 2;

    label {
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 3px;
      padding-block: 10px;

      span {
        font-size: 1.1rem;
      }

      .icon_outer {
        padding: 0px 15px;
        border-radius: 30px;
        position: relative;
        transition: color 0.2s ease-out;
        z-index: 0;
        &::after {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          bottom: 0;
          width: 22px;
          opacity: 0;
          border-radius: inherit;
          background-color: var(--primary);
          transition:
            width 0.2s ease-out,
            opacity 0.2s ease-out;
          z-index: -1;
        }
      }

      input {
        display: none;

        &:checked ~ .icon_outer {
          color: #fff;
          &::after {
            animation: fadeIn 0.4s ease forwards;
          }
        }
        &:checked ~ span {
          // color: var(--primary);
          animation: reColor 0.4s ease forwards;
        }
      }

      @keyframes reColor {
        from {
          color: inherit;
        }
        to {
          color: var(--primary);
        }
      }
      @keyframes fadeIn {
        from {
          width: 22px;
          opacity: 0;
        }
        to {
          width: 100%;
          opacity: 1;
        }
      }
    }

    @media (max-width: $lg) {
      display: flex;
    }
  }

  :global(body .layout) {
    @media (max-width: $lg) {
      &:has([name="nav"]#search:checked) {
        > aside {
          transform: translateX(0);
        }
        > main {
          transform: translateX(100%);
        }
      }
      &:has([name="nav"]#templates:checked) {
        > aside {
          transform: translateX(-100%);
        }
        > main {
          transform: translateX(0);
        }
      }
    }
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
