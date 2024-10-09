<script>
  import Header from "$lib/components/header/Header.svelte";
  import Column from "./Column.svelte";
  import { templatesStore } from "$lib/stores/templates";
  import { CaretRight } from "phosphor-svelte";

  let selectedCategories = [];
  let lastLevel = -1;
  $: categories = $templatesStore;

  const selectCategory = (level, selectedCategory) => {
    selectedCategories = selectedCategories.slice(0, level);
    selectedCategories.push(selectedCategory);

    setTimeout(() => {
      const container = document.querySelector(".template_columns");
      if (container) {
        const visibleColumns = container.children.length;
        const columnWidth = container.offsetWidth / visibleColumns;
        const scrollPosition = columnWidth * level;
        container.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }
      lastLevel = level;
    }, 20);
  };

  const moveItem = (item, fromCategory, toCategory) => {
    console.log("Moving item", item, "from", fromCategory, "to", toCategory);
  };

  const onRename = (category) => {
    // Set the category name as editable and select its text
    const nameElement = document.querySelector(
      `.category-${category.id} .name`
    );
    if (nameElement) {
      nameElement.setAttribute("contenteditable", true);
      nameElement.focus();
      const range = document.createRange();
      range.selectNodeContents(nameElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      // Add blur event to capture new name
      nameElement.addEventListener(
        "blur",
        () => {
          const newName = nameElement.textContent.trim();
          console.log("New category name:", newName);
          nameElement.removeAttribute("contenteditable");
          // You can add logic here to update the category name in your store
        },
        { once: true }
      );
    }
  };

  const onRemove = (category) => {
    if (
      confirm(
        `Are you sure you want to remove the category "${category.name}" and all its subcategories?`
      )
    ) {
      console.log(`Category ${category.name} removed`);
      // Logic to remove the category and its subcategories from the store
      removeCategoryAndSubcategories(category);
    }
  };

  // Function to handle breadcrumb click (navigate back to that category)
  const navigateToCategory = (index) => {
    selectCategory(index, selectedCategories[index]);
  };

  // Function to remove category and all subcategories
  const removeCategoryAndSubcategories = (categoryToRemove) => {
    // Function to recursively remove categories and subcategories
    const removeRecursively = (categoryList, categoryId) => {
      return categoryList.filter((category) => {
        // Remove the category and all its subcategories
        if (category.id === categoryId) {
          return false;
        }
        // If the category has subcategories, apply the same logic to them
        if (category.sub) {
          category.sub = removeRecursively(category.sub, categoryId);
        }
        return true;
      });
    };

    // Update the templates store by removing the category from it
    templatesStore.update((categories) => {
      // Apply the removeRecursively function to the top-level categories
      return removeRecursively(categories, categoryToRemove.id);
    });
  };
</script>

<Header />

<!-- Breadcrumb Component -->
<nav class="breadcrumb">
  {#if selectedCategories.length > 0}
    <ul>
      <!-- <li on:click={() => navigateToCategory(0)}>Home</li> -->
      {#each selectedCategories as category, index}
        <li on:click={() => navigateToCategory(index)}>
          {category.name}
          <span class="flex icon">
            <CaretRight size={14} />
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</nav>

<div class="template_columns">
  <!-- Render the first column with the top-level categories -->
  <Column
    {categories}
    level={0}
    onSelect={selectCategory}
    onMove={moveItem}
    {onRename}
    {onRemove}
    {selectedCategories}
  />

  {#each selectedCategories as selectedCategory, index}
    <Column
      categories={selectedCategory.sub}
      level={index + 1}
      onSelect={selectCategory}
      onMove={moveItem}
      {onRename}
      {onRemove}
      {selectedCategories}
    />
  {/each}
</div>

<style lang="scss">
  .breadcrumb {
    margin-bottom: 1rem;
    min-height: 30px;

    ul {
      display: flex;
      list-style: none;
      padding: 0;
      gap: 0.5rem;
    }
    li {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      &:hover {
        text-decoration: underline;
      }
      &:last-child {
        .icon {
          display: none;
        }
      }
    }
  }

  .template_columns {
    --gap: 2rem;
    display: grid;
    overflow-x: auto;
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
