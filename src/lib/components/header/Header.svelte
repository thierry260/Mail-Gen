<script>
  import Breadcrumbs from "$lib/components/header/Breadcrumbs.svelte";
  import ToggleSwitch from "$lib/components/ToggleSwitch.svelte";

  export let type = "overview";
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
        <span class="legend">Tekst voorbeeld bekijken</span>
        <ToggleSwitch
          on:change={(e) => {
            console.log(e);
          }}
        />
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
    z-index: 1;

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
