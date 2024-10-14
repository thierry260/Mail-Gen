<script>
  import Header from "$lib/components/header/Header.svelte";
  import Column from "./Column.svelte";
  import { templatesStore } from "$lib/stores/templates";
  import { CaretRight } from "phosphor-svelte";

  let selectedCategories = [];
  let lastLevel = -1;
  let categories = []; // Declare categories locally

  // Subscribe to the templatesStore
  $: {
    categories = $templatesStore; // Update local categories when store changes
  }

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

  const onRename = (item, type = "category") => {
    const nameElement = document.querySelector(`.${type}-${item.id} .name`);
    if (nameElement) {
      nameElement.setAttribute("contenteditable", true);
      nameElement.focus();
      const range = document.createRange();
      range.selectNodeContents(nameElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const saveNewName = () => {
        const newName = nameElement.textContent.trim();
        console.log("New category name:", newName);
        nameElement.removeAttribute("contenteditable");
        // Update category name in the store
        templatesStore.update((cats) => {
          return cats.map((cat) => {
            if (cat.id === item.id) {
              return { ...cat, name: newName }; // Update the category name
            } else if (cat.sub) {
              return {
                ...cat,
                sub: cat.sub.map((subCat) => {
                  if (subCat.id === item.id) {
                    return { ...subCat, name: newName }; // Update subcategory name
                  }
                  return subCat;
                }),
              };
            }
            return cat;
          });
        });
      };

      // Event listeners for saving new name
      nameElement.addEventListener("blur", saveNewName, { once: true });
      nameElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          saveNewName();
        }
      });
    }
  };

  const onRemove = (item, type = "category") => {
    const typeFormatted = type == "category" ? "categorie" : "template";
    if (
      confirm(
        `Weet je zeker dat je ${typeFormatted} "${item.name}" wilt verwijderen?`
      )
    ) {
      if (type == "template") {
        // Logic to remove the template
      } else {
        removeCategoryAndSubcategories(item);
      }
      console.log(`Item ${item.name} removed`);
    }
  };

  const navigateToCategory = (index) => {
    selectCategory(index, selectedCategories[index]);
  };

  const removeCategoryAndSubcategories = (categoryToRemove) => {
    const removeRecursively = (categoryList, categoryId) => {
      return categoryList.filter((category) => {
        if (category.id === categoryId) {
          return false;
        }
        if (category.sub) {
          category.sub = removeRecursively(category.sub, categoryId);
        }
        return true;
      });
    };

    templatesStore.update((categories) => {
      return removeRecursively(categories, categoryToRemove.id);
    });
  };

  const addCategory = (name) => {
    const newCategory = { id: Date.now(), name, sub: [] };
    if (lastLevel === -1) {
      templatesStore.update((cats) => [...cats, newCategory]);
    } else {
      templatesStore.update((cats) => {
        const addToSubCategory = (categoryList) => {
          return categoryList.map((cat) => {
            if (cat.id === selectedCategories[lastLevel].id) {
              return {
                ...cat,
                sub: [...(cat.sub || []), newCategory],
              };
            } else if (cat.sub) {
              return {
                ...cat,
                sub: addToSubCategory(cat.sub),
              };
            }
            return cat;
          });
        };
        return addToSubCategory(cats);
      });
    }
  };

  const addTemplate = (name, categoryId) => {
    const newTemplate = { id: Date.now(), name };
    templatesStore.update((cats) => {
      return cats.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            templates: [...(cat.templates || []), newTemplate],
          };
        } else if (cat.sub) {
          return {
            ...cat,
            sub: addTemplateToSubCategories(cat.sub, categoryId, newTemplate),
          };
        }
        return cat;
      });
    });
  };

  const addTemplateToSubCategories = (
    categoryList,
    categoryId,
    newTemplate
  ) => {
    return categoryList.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          templates: [...(cat.templates || []), newTemplate],
        };
      } else if (cat.sub) {
        return {
          ...cat,
          sub: addTemplateToSubCategories(cat.sub, categoryId, newTemplate),
        };
      }
      return cat;
    });
  };
</script>

<Header />

<!-- Breadcrumb Component -->
<nav class="breadcrumb">
  {#if selectedCategories.length > 0}
    <ul>
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
    onAddCategory={addCategory}
    onAddTemplate={addTemplate}
  />

  {#each selectedCategories as selectedCategory, index}
    <Column
      allCategories={categories}
      id={selectedCategory.id}
      {selectedCategory}
      level={index + 1}
      onSelect={selectCategory}
      onMove={moveItem}
      {onRename}
      {onRemove}
      {selectedCategories}
      onAddCategory={addCategory}
      onAddTemplate={addTemplate}
    />
  {/each}
</div>

<style lang="scss">
  .breadcrumb {
    margin-bottom: -30px;
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
    padding-top: 40px;
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
