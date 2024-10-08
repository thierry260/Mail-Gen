<script>
  import Header from "$lib/components/header/Header.svelte";
  import Column from "./Column.svelte";
  import { templatesStore } from "$lib/stores/templates";
  import { onDestroy, onMount } from "svelte";

  let selectedCategories = [];
  let lastLevel = -1;
  $: categories = $templatesStore;

  const selectCategory = (level, selectedCategory) => {
    console.log("level: ", level);

    // Reset columns to the left
    selectedCategories = selectedCategories.slice(0, level);
    // Add the clicked category
    selectedCategories.push(selectedCategory);

    setTimeout(() => {
      // Scroll the container to the level
      const container = document.querySelector(".template_columns");
      if (container) {
        // Calculate the scroll position based on the level (column width * level)
        const columnWidth = container.scrollWidth / container.children.length;
        const scrollPosition = columnWidth * level;

        // Smoothly scroll to the selected column
        container.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }

      lastLevel = level;
    }, 20);
  };

  const moveItem = (item, fromCategory, toCategory) => {
    // Logic for moving the item using Sortable.js
    console.log("Moving item", item, "from", fromCategory, "to", toCategory);
  };
</script>

<Header />

<div class="template_columns">
  <!-- Render the first column with the top-level categories -->
  <Column
    {categories}
    level={0}
    onSelect={selectCategory}
    onMove={moveItem}
    {selectedCategories}
  />

  <!-- Dynamically render the subsequent columns based on the selected categories -->
  {#each selectedCategories as selectedCategory, index}
    <Column
      categories={selectedCategory.sub}
      level={index + 1}
      onSelect={selectCategory}
      onMove={moveItem}
      {selectedCategories}
    />
  {/each}
</div>

<style lang="scss">
  .template_columns {
    --gap: 2rem;
    display: grid;
    overflow-x: auto;
    padding-bottom: 40px;
    grid-auto-columns: calc((100% / 3) - (var(--gap, 2rem) * 2 / 3));
    grid-auto-flow: column;
    grid-column-gap: var(--gap, 2rem);
    grid-template-rows: minmax(0, 1fr);

    -ms-overflow-style: none; /* Internet Explorer 10+ */
    scrollbar-width: none; /* Firefox */
    &::-webkit-scrollbar {
      display: none; /* Safari and Chrome */
    }
  }
  :global(.template_columns > .column) {
    flex: 1;
    width: 100%;
    padding-right: var(--gap, 2rem);
    border-right: 1px solid var(--border);
  }
</style>
