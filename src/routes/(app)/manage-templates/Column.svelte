<script>
  import Sortable from "sortablejs";
  import { onMount } from "svelte";

  export let categories = [];
  export let level = 0;
  export let onSelect;
  export let onMove;
  export let selectedCategories = []; // Receive selectedCategories as a prop

  let columnElement;

  onMount(() => {
    new Sortable(columnElement, {
      group: "categories",
      animation: 150,
      onEnd: (event) => {
        const item = categories[event.oldIndex];
        const toCategory = categories[event.newIndex];
        onMove(item, categories[event.oldIndex], toCategory);
      },
    });
  });
</script>

<div bind:this={columnElement} class="column">
  {#each categories as category (category.id)}
    <div
      class="category {selectedCategories.includes(category) ? 'active' : ''}"
      on:click={() => onSelect(level, category)}
    >
      <span>{category.name}</span>
    </div>
  {/each}
  <button class="button simple add_cat"> + Categorie toevoegen </button>
</div>

<style lang="scss">
  .column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 300px;

    .category {
      cursor: pointer;
      padding: 15px;
      background-color: #f0f0f0;
      border-radius: 5px;
      border: 1px solid transparent;
      transition:
        background-color 0.2s ease-out,
        border-color 0.2s ease-out,
        color 0.2s ease-out;

      &:hover {
        background-color: #e0e0e0;
      }

      &.active {
        border-color: var(--primary);
        background-color: hsl(from var(--primary) h s calc(l + 25));
        color: hsl(from var(--primary) h s calc(l - 60));

        // color: #fff;
        // background-color: hsl(from var(--primary) h s calc(l - 60));
      }
    }

    .add_cat {
      margin-top: 10px;
    }
  }
</style>
