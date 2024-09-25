<script>
  import Breadcrumbs from "$lib/components/header/Breadcrumbs.svelte";
  import ToggleSwitch from "$lib/components/ToggleSwitch.svelte";
  import { showContent } from "$lib/stores/showContent.js";
  import { get } from "svelte/store";

  export let type = "overview";

  // Get the initial value from the store
  let checked = get(showContent);

  // Update the store when the switch changes
  function handleToggleChange(event) {
    showContent.set(event.detail.checked);
  }
</script>

<header>
  <div class="title">
    <Breadcrumbs />
  </div>
  <div class="actions">
    {#if type == "template"}
      <slot></slot>
    {:else}
      <label class="action">
        <span class="legend toggle_label"
          ><span class="desktop">Toon voorbeelden</span><span class="mobile"
            >Voorbeelden</span
          ></span
        >
        <ToggleSwitch bind:checked on:change={handleToggleChange} />
      </label>
    {/if}
  </div>
</header>

<style lang="scss">
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block: 30px;
    border-bottom: 1px solid var(--gray-250);
    margin-bottom: 30px;
    position: sticky;
    top: 0;
    background-color: var(--body-background, #f8f8f8);
    top: -50px;
    margin-top: -50px;
    z-index: 9;
    gap: 20px;

    @media (max-width: $lg) {
      padding-block: 10px;
      top: -30px;
      margin-top: -30px;
    }

    .title {
      overflow: hidden;
      @media (max-width: $lg) {
        // overflow: unset;
      }
    }

    .toggle_label {
      .mobile {
        display: none;
      }
      @media (max-width: $xs) {
        .mobile {
          display: inline-block;
        }
        .desktop {
          display: none;
        }
      }
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .action {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;

      .legend {
        font-size: 1.3rem;
      }
      &:first-of-type {
        margin-top: 10px;
      }
      &:last-of-type {
        margin-bottom: 10px;
      }
      .legend {
        margin-block: 0;
      }
    }
  }
</style>
