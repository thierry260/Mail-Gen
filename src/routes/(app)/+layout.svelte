<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { auth } from "$lib/firebase";
  import { onAuthStateChanged } from "firebase/auth";
  import { goto } from "$app/navigation";
  import Sidebar from "$lib/components/sidebar/Sidebar.svelte";
  import Header from "$lib/components/header/Header.svelte";
  import Thumbnail from "$lib/components/Thumbnail.svelte";
  import {
    House,
    ListMagnifyingGlass,
    GearSix,
    EnvelopeSimple,
    Folders,
  } from "phosphor-svelte";

  let user = null;
  let url = "";
  let recentlyViewed = [];
  let favoriteTemplates = [];

  $: {
    url = $page.url.href; // Update url whenever the page URL changes
  }

  onMount(() => {
    onAuthStateChanged(auth, (currentUser) => {
      user = currentUser;
      if (!user) {
        goto("/login");
      }
    });

    // Function to retrieve recently viewed templates from localStorage
    const getRecentlyViewed = () => {
      return JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    };

    // Function to retrieve favorite templates from localStorage
    const getFavoriteTemplates = () => {
      return JSON.parse(localStorage.getItem("favoriteTemplates")) || [];
    };

    // Retrieve recently viewed and favorite templates
    recentlyViewed = getRecentlyViewed();
    favoriteTemplates = getFavoriteTemplates();
  });
</script>

<div class="layout" data-url={url}>
  <aside><Sidebar /></aside>
  <main>
    <slot />
  </main>
  <nav class="mobile_nav">
    <label>
      <input type="radio" name="nav" id="home" value="home" checked />
      <div class="icon_outer">
        <div class="icon default"><House size={20} /></div>
        <div class="icon active">
          <House size={20} weight="fill" class="active" />
        </div>
      </div>
      <span>Home</span>
    </label>
    <label>
      <input type="radio" name="nav" id="browse" value="browse" />
      <div class="icon_outer">
        <div class="icon default"><Folders size={20} /></div>
        <div class="icon active">
          <Folders size={20} weight="fill" class="active" />
        </div>
      </div>
      <span>Bladeren</span>
    </label>
    <label>
      <input type="radio" name="nav" id="search" value="search" />
      <div class="icon_outer">
        <div class="icon default"><ListMagnifyingGlass size={20} /></div>
        <div class="icon active">
          <ListMagnifyingGlass size={20} weight="fill" class="active" />
        </div>
      </div>
      <span>Zoeken</span>
    </label>
  </nav>
  <div class="mobile_home">
    <div class="favorite_templates">
      <h6>Favoriete templates</h6>
      {#if favoriteTemplates.length === 0}
        <p class="empty">Je hebt nog geen favoriete templates</p>
      {:else}
        <div class="thumbnails">
          {#each favoriteTemplates as template}
            <Thumbnail
              type={"basic"}
              id={template.id}
              name={template.name}
              content={template.content}
            />
          {/each}
        </div>
      {/if}
    </div>

    <div class="recently_viewed">
      <h6>Recent bekeken</h6>
      {#if recentlyViewed.length === 0}
        <p class="empty">Je hebt geen recent bekeken templates</p>
      {:else}
        <div class="thumbnails">
          {#each recentlyViewed as template}
            <Thumbnail
              type={"basic"}
              id={template.id}
              name={template.name}
              content={template.content}
            />
          {/each}
        </div>
      {/if}
    </div>
  </div>
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
      > *:not(nav) {
        grid-column: 1 / -1;
        grid-row: 1;
        transition: transform 0s ease;
        will-change: transform;
      }
      aside {
        transform: translateX(100%);
        position: relative;
        z-index: 1;
      }
      .mobile_home {
        position: relative;
        z-index: 1;
      }
    }

    @media (max-width: $md) {
      > *:not(nav) {
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

  [class^="mobile_"] {
    display: none;
    @media (max-width: $lg) {
      display: flex;
    }
  }

  nav.mobile_nav {
    z-index: 99;
    background-color: #fff;
    align-items: center;
    justify-content: space-around;
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
    grid-row: 2;
    padding: 5px;

    label {
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 3px;
      padding-block: 5px;
      border-radius: 10px;
      background-color: #fff;
      opacity: 0.5;
      transition:
        background-color 0.2s ease-out,
        background-opacity 0.2s ease-out;

      &:has(input:checked) {
        background-color: var(--background);
        opacity: 1;
      }

      span {
        font-size: 1.1rem;
      }

      .icon_outer {
        padding: 0px 15px;
        border-radius: 30px;
        position: relative;
        transition: color 0.2s ease-out;
        z-index: 0;
        display: grid;
        > * {
          grid-column: 1/-1;
          grid-row: 1/-1;
        }

        .icon {
          transition:
            opacity 0.4s ease-out,
            transform 0.4s ease-out;
        }
        .active {
          opacity: 0;
          transform: scale(0.5);
        }
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
          background-color: var(--primary-darker);
          transition:
            width 0.2s ease-out,
            opacity 0.2s ease-out;
          z-index: -1;
        }
      }

      input {
        display: none;

        &:checked ~ .icon_outer {
          // color: #fff;

          .default {
            opacity: 0;
            transform: scale(0.5);
          }
          .active {
            opacity: 1;
            transform: scale(1);
          }
          &::after {
            // animation: fadeIn 0.4s ease forwards;
          }
        }
        &:checked ~ span {
          // color: var(--primary-darker);
          // animation: reColor 0.4s ease forwards;
        }
      }

      @keyframes reColor {
        from {
          color: inherit;
        }
        to {
          color: var(--primary-darker);
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
  }
  .mobile_home.mobile_home {
    padding: 30px;
    flex-direction: column;
    gap: 40px;
    background-color: var(--body-background);

    h6 {
      margin-bottom: 1em;
    }

    .thumbnails {
      display: grid;
      flex-direction: column;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 520px), 1fr));
      gap: 15px;
    }
  }

  :global(body .layout) {
    @media (max-width: $lg) {
      &:has([name="nav"]#home:checked) {
        > .mobile_home {
          transform: translateX(0);
        }
        > main {
          transform: translateX(100%);
          // transition-duration: 0s;
        }
        > aside {
          transform: translateX(100%);
        }
      }
      &:has([name="nav"]#browse:checked) {
        > .mobile_home {
          transform: translateX(-100%);
        }
        > main {
          transform: translateX(0);
        }
        > aside {
          transform: translateX(100%);
        }
      }
      &:has([name="nav"]#search:checked) {
        > .mobile_home {
          transform: translateX(-100%);
        }
        > main {
          transform: translateX(-100%);
          // transition-duration: 0s;
        }
        > aside {
          transform: translateX(0);
        }
      }
    }
  }

  :global(body main:has(.home) nav:first-child) {
    display: flex;
  }
  :global(body .empty.empty.empty) {
    --notice-hs: 214.29deg, 20%;
    --response-color: var(--notice-hs); // Standaard response kleur voor notice
    background-color: hsl(var(--response-color), 98%);
    color: hsl(var(--response-color), 50%);
    border: 1px dashed hsl(var(--response-color), 75%);
    padding: 20px;
    border-radius: 5px;
    padding: 20px;
    text-align: center;
    font-size: 1.4rem;
    line-height: 1.5;
    min-height: 40px;
    box-sizing: border-box;

    &.rich {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px 5px;
    }
  }
</style>
