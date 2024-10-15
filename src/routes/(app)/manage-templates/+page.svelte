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

  // $: {
  //   console.log({ selectedCategories });
  // }

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
    // console.log("Moving item", item, "from", fromCategory, "to", toCategory);

    templatesStore.update((cats) => {
      // Step 1: Remove the item from its current category
      const removeItem = (categoryList, itemId) => {
        return categoryList.map((cat) => {
          if (cat.id === fromCategory) {
            return {
              ...cat,
              templates: cat.templates
                ? cat.templates.filter((t) => t.id !== itemId)
                : cat.templates,
              sub: cat.sub ? cat.sub.filter((s) => s.id !== itemId) : cat.sub,
            };
          } else if (cat.sub) {
            return {
              ...cat,
              sub: removeItem(cat.sub, itemId),
            };
          }
          return cat;
        });
      };

      // Step 2: Add the item to the new category
      const addItemToCategory = (categoryList, newItem, targetCategoryId) => {
        return categoryList.map((cat) => {
          if (cat.id === targetCategoryId) {
            const itemKey = item.type === "template" ? "templates" : "sub";
            return {
              ...cat,
              [itemKey]: [...(cat[itemKey] || []), newItem],
            };
          } else if (cat.sub) {
            return {
              ...cat,
              sub: addItemToCategory(cat.sub, newItem, targetCategoryId),
            };
          }
          return cat;
        });
      };

      // Step 3: Update the store
      const updatedCats = addItemToCategory(
        removeItem(cats, item.id),
        item,
        toCategory
      );
      return updatedCats;
    });

    console.log(
      `Item ${item.name} moved from category ${fromCategory} to ${toCategory}`
    );
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
        console.log("New category/template name:", newName);
        nameElement.removeAttribute("contenteditable");

        // Update category/template name in the store
        templatesStore.update((cats) => {
          return cats.map((cat) => {
            if (cat.id === item.id) {
              return { ...cat, name: newName }; // Update the category name
            } else if (type === "template" && cat.templates) {
              // Search through templates if the type is "template"
              return {
                ...cat,
                templates: cat.templates.map((template) => {
                  if (template.id === item.id) {
                    return { ...template, name: newName }; // Update template name
                  }
                  return template;
                }),
              };
            } else if (cat.sub) {
              // Continue to search in subcategories for type "category"
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

  const addCategory = (name, categoryId) => {
    const newCategory = { id: Date.now(), name, sub: [], templates: [] };
    if (!categoryId) {
      templatesStore.update((cats) => [...cats, newCategory]);
      console.log(categoryId);
    } else {
      templatesStore.update((cats) => {
        const updatedCats = addToSubCategories(
          cats,
          categoryId,
          newCategory,
          "category"
        );
        // Code to trigger after the update
        afterAddToSubCategories();
        return updatedCats;
      });
    }
  };

  const addTemplate = (name, categoryId) => {
    const newTemplate = { id: Date.now(), name };
    console.log(categoryId);
    templatesStore.update((cats) => {
      const updatedCats = addToSubCategories(
        cats,
        categoryId,
        newTemplate,
        "template"
      );
      // Code to trigger after the update
      afterAddToSubCategories();
      return updatedCats;
    });
  };

  const addToSubCategories = (categoryList, categoryId, newItem, itemType) => {
    return categoryList.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          [itemType === "template" ? "templates" : "sub"]: [
            ...(cat[itemType === "template" ? "templates" : "sub"] || []),
            newItem,
          ],
        };
      } else if (cat.sub) {
        return {
          ...cat,
          sub: addToSubCategories(cat.sub, categoryId, newItem, itemType),
        };
      }
      return cat;
    });
  };

  const afterAddToSubCategories = () => {
    // Your logic here, for example:
    console.log("Item added to subcategories");

    setTimeout(() => {
      console.log({ selectedCategories });
      selectedCategories.forEach((selectedCategory) => {
        console.log(`.category.category-${selectedCategory.id}`);
        setTimeout(() => {
          document
            .querySelector(`.category.category-${selectedCategory.id}`)
            ?.click();
        }, 0);
      });
    }, 0);
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
      categories={selectedCategory.sub}
      templates={selectedCategory.templates}
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
