<script>
  import Column from "./Column.svelte";
  import { templatesStore } from "$lib/stores/templates";
  import { CaretRight, House } from "phosphor-svelte";
  import { createNewTemplate, generateId } from "$lib/utils/create";
  import toast_ from "svelte-french-toast";
  import UndoToast from "./UndoToast.svelte";
  import { updateDoc, doc } from "firebase/firestore";
  import { db } from "$lib/firebase";

  let selectedCategories = [];
  let lastLevel = -1;

  let categories = []; // Declare categories locally
  let previousTemplates = [];
  let undoTimeout;

  // Subscribe to the templatesStore
  $: {
    categories = $templatesStore; // Update local categories when store changes
  }

  $: console.log("savingTemplates - previousTemplates", previousTemplates);

  // Define the removeContentProperty function
  function removeContentProperty(arr) {
    arr.forEach((item) => {
      if (item.templates && Array.isArray(item.templates)) {
        item.templates.forEach((template) => {
          delete template.content;
        });
      }
      if (item.sub && Array.isArray(item.sub)) {
        removeContentProperty(item.sub);
      }
    });

    return arr;
  }

  // Create a reactive statement to show the toast when templatesStore changes
  $: if ($templatesStore) {
    const currentTemplates = JSON.parse(JSON.stringify($templatesStore));
    let undoTriggered = false; // Flag to track if undo has been triggered

    console.log("savingTemplates - $templatesStore updated", $templatesStore);

    if (previousTemplates.length) {
      console.log("savingTemplates - comparing");
      if (
        JSON.stringify(previousTemplates) !== JSON.stringify($templatesStore)
      ) {
        console.log("savingTemplates - templatesStore different than previous");

        // Trigger custom toast with the UndoToast component
        toast_(
          UndoToast,
          {
            props: {
              onUndo: () => {
                templatesStore.set(previousTemplates); // Properly passing onUndo
                undoTriggered = true; // Set flag to indicate undo was triggered
              },
            },
          },
          { duration: 5000, position: "bottom-right" }
        );

        // Set a timeout to apply changes to Firestore/localStorage after the toast
        undoTimeout = setTimeout(() => {
          if (!undoTriggered) {
            // Check if undo was not triggered
            // Remove content properties from templates before saving
            const newCategoriesArray = removeContentProperty(currentTemplates);

            // Here you would update Firebase or localStorage
            console.log("savingTemplates - saved", newCategoriesArray);

            const docRef = doc(
              db,
              "workspaces",
              localStorage.getItem("workspace")
            );

            updateDoc(docRef, {
              categories: newCategoriesArray,
            });
          }
        }, 5000);
      }
    }

    // Store the current state as previous for undo purposes
    previousTemplates = currentTemplates;
  }

  const navigateToCategory = (index) => {
    if (index >= 0) {
      selectCategory(index, selectedCategories[index]);
    } else {
      selectCategory(0, false);
    }
  };

  const selectCategory = (level, selectedCategory) => {
    if (selectedCategory) {
      selectedCategories = selectedCategories.slice(0, level);
      selectedCategories.push(selectedCategory);

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
    } else {
      selectedCategories = [];

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
    }
  };

  const moveItem = (
    type,
    fromCategoryId,
    fromIndex,
    toCategoryId,
    toIndex,
    movedItemId
  ) => {
    console.log(
      "moveItem called with:",
      type,
      fromCategoryId,
      fromIndex,
      toCategoryId,
      toIndex
    );

    // Fetch the current state of the templatesStore
    const currentTemplates = $templatesStore;

    // Function to find the item and its parent
    const findItemAndParent = (
      fromCategoryId,
      movedItemId,
      currentArray,
      type = "categories"
    ) => {
      if (!fromCategoryId) {
        const item = currentArray?.find((cat) => cat.id == movedItemId);
        return { item, parent: false }; // Parent is false for top-level categories
      } else {
        for (let category of currentArray) {
          // Check if the current category is the one we are looking in
          if (category.id === fromCategoryId) {
            if (type === "categories") {
              const item = category.sub?.find((sub) => sub.id == movedItemId);
              if (item) return { item, parent: category };
            } else if (type === "templates") {
              const item = category.templates?.find(
                (template) => template.id == movedItemId
              );
              if (item) return { item, parent: category };
            }
          }

          // Recursively search in subcategories
          if (category.sub?.length) {
            const foundInSub = findItemAndParent(
              fromCategoryId,
              movedItemId,
              category.sub,
              type
            );
            if (foundInSub) return foundInSub;
          }
        }
      }
      return null; // Item not found
    };

    // Function to find the category by its ID
    const findCategoryById = (categoryId, categoriesArray) => {
      for (let category of categoriesArray) {
        if (category.id === categoryId) return category;
        if (category.sub?.length) {
          const foundInSub = findCategoryById(categoryId, category.sub);
          if (foundInSub) return foundInSub;
        }
      }
      return null; // Category not found
    };

    // Identify the item being moved and its parent
    let itemToMove;
    let fromParent;

    // Find the item and its parent
    const found = findItemAndParent(
      fromCategoryId,
      movedItemId,
      currentTemplates,
      type
    );
    console.log("Found item:", found);

    if (found) {
      itemToMove = { ...found.item }; // Clone the item to move
      fromParent = found.parent || false;

      // Adjust `toIndex` if moving within the same parent or array
      if (fromCategoryId === toCategoryId && fromIndex < toIndex) {
        toIndex--; // Adjust `toIndex` to account for the shift after removal
      }

      if (type === "categories") {
        // Remove item from the correct place
        if (fromParent === false) {
          // Top-level category
          if (fromIndex >= 0 && fromIndex < currentTemplates.length) {
            console.log(`${itemToMove.name} removed from index ${fromIndex}`);
            currentTemplates.splice(fromIndex, 1);
          } else {
            console.warn("fromIndex out of bounds:", fromIndex);
          }
        } else if (fromIndex >= 0 && fromIndex < fromParent.sub.length) {
          fromParent.sub.splice(fromIndex, 1); // Remove from sub-category
        } else {
          console.warn("fromIndex out of bounds:", fromIndex);
        }
      } else if (type === "templates") {
        if (fromIndex >= 0 && fromIndex < fromParent.templates.length) {
          fromParent.templates.splice(fromIndex, 1);
        } else {
          console.warn("fromIndex out of bounds:", fromIndex);
        }
      }
    }

    // Now we need to add it to the target position
    if (itemToMove) {
      if (toCategoryId) {
        // Correctly find the target category where the item needs to be added
        const targetCategory = findCategoryById(toCategoryId, currentTemplates);

        if (targetCategory) {
          if (type === "categories") {
            if (toIndex >= 0 && toIndex <= targetCategory.sub.length) {
              targetCategory.sub.splice(toIndex, 0, itemToMove); // Insert into subcategories of target
            } else {
              console.warn("toIndex out of bounds:", toIndex);
            }
          } else if (type === "templates") {
            if (toIndex >= 0 && toIndex <= targetCategory.templates.length) {
              targetCategory.templates.splice(toIndex, 0, itemToMove); // Insert into templates of target
            } else {
              console.warn("toIndex out of bounds:", toIndex);
            }
          }
        } else {
          console.warn("Target category not found:", toCategoryId);
        }
      } else {
        // If no target category, we're moving a top-level item
        console.log("fromParent: ", fromParent);
        console.log("toIndex: ", toIndex);
        console.log("itemToMove: ", itemToMove);
        if (fromParent === false) {
          // If moving within top-level categories
          console.log(`${itemToMove.name} added to index ${toIndex}`);
          currentTemplates.splice(toIndex, 0, itemToMove); // Insert at the corrected index
        } else if (type === "categories") {
          fromParent.sub.splice(toIndex, 0, itemToMove); // Add to the same parent at new position
        } else if (type === "templates") {
          fromParent.templates.splice(toIndex, 0, itemToMove);
        }
      }
    }

    // Update the store with the new state
    templatesStore.set([...currentTemplates]); // Use a shallow copy to trigger reactivity
    // templatesStore.update((currentTemplates) => currentTemplates);
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

        // Recursive function to update categories and templates
        const updateNameRecursively = (categories) => {
          return categories.map((cat) => {
            // If renaming a category
            if (type === "category" && cat.id === item.id) {
              return { ...cat, name: newName };
            }

            // If renaming a template inside the category or its subcategories
            if (cat.templates) {
              cat.templates = cat.templates.map((template) => {
                if (template.id === item.id && type === "template") {
                  return { ...template, name: newName }; // Update template name
                }
                return template;
              });
            }

            // If the category has subcategories, search recursively in subcategories
            if (cat.sub && cat.sub.length > 0) {
              return {
                ...cat,
                sub: updateNameRecursively(cat.sub), // Recursively update subcategories
              };
            }

            return cat; // Return the category unchanged if no matches
          });
        };

        // Update the templatesStore using the recursive function
        templatesStore.update((cats) => updateNameRecursively(cats));
      };

      // Event listeners for saving the new name
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
    const typeFormatted = type === "category" ? "categorie" : "template";
    if (
      confirm(
        `Weet je zeker dat je ${typeFormatted} "${item.name}" wilt verwijderen?`
      )
    ) {
      if (type === "template") {
        // Logic to remove the template recursively
        removeTemplate(item.id);
      } else {
        // Logic to remove the category and its subcategories recursively
        removeCategoryAndSubcategories(item.id);
      }
      console.log(`Item ${item.name} removed`);
      console.log($templatesStore);
      refreshDOM();
    }
  };

  const removeCategoryAndSubcategories = (categoryIdToRemove) => {
    const removeCategoryRecursively = (categories) => {
      return categories.filter((category) => {
        if (category.id === categoryIdToRemove) {
          console.log("checking category: ", category.id);
          console.log("categoryIdToRemove: ", categoryIdToRemove);
          console.log("category found");
          return false; // Remove the matching category
        }

        // Recursively check and remove subcategories if any
        if (category.sub) {
          category.sub = removeCategoryRecursively(category.sub);
        }

        // Recursively check and remove templates within the category if any
        if (category.templates) {
          category.templates = category.templates.filter(
            (template) => template.id !== categoryIdToRemove
          );
        }

        return true; // Keep this category if it doesn't match the one to remove
      });
    };

    templatesStore.update((categories) =>
      removeCategoryRecursively(categories)
    );
  };

  const removeTemplate = (templateIdToRemove) => {
    const removeTemplateRecursively = (categories) => {
      return categories.map((category) => {
        // Remove the template if it matches
        if (category.templates) {
          category.templates = category.templates.filter(
            (template) => template.id !== templateIdToRemove
          );
        }

        // If the category has subcategories, check for templates recursively
        if (category.sub) {
          category.sub = removeTemplateRecursively(category.sub);
        }

        return category;
      });
    };

    templatesStore.update((categories) =>
      removeTemplateRecursively(categories)
    );
  };

  const addCategory = (name, categoryId) => {
    const newCategory = { id: generateId(), name, sub: [], templates: [] };
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
        return updatedCats;
      });
      refreshDOM();
    }
  };

  const addTemplate = async (name, categoryId) => {
    const newTemplateId = await createNewTemplate(categoryId, name);
    const newTemplate = { id: newTemplateId, name };
    console.log(categoryId);
    templatesStore.update((cats) => {
      const updatedCats = addToSubCategories(
        cats,
        categoryId,
        newTemplate,
        "template"
      );
      // Code to trigger after the update
      return updatedCats;
    });
    refreshDOM();
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

  const refreshDOM = () => {
    // Your logic here, for example:
    console.log("Item added to subcategories");

    setTimeout(() => {
      console.log({ selectedCategories });
      selectedCategories.forEach((selectedCategory, index) => {
        console.log(`.category.category-${selectedCategory.id}`);
        setTimeout(() => {
          document
            .querySelector(`.category.category-${selectedCategory.id}`)
            ?.click();
        }, 20);
      });
    }, 20);
  };
</script>

<!-- Breadcrumb Component -->
<nav class="breadcrumb">
  {#if selectedCategories.length > 0}
    <ul>
      <li on:click={() => navigateToCategory(-1)}>
        <House size={14} />
        <span class="flex icon">
          <CaretRight size={14} />
        </span>
      </li>
      {#each selectedCategories as category, index}
        <li on:click={() => navigateToCategory(index)}>
          {category.name}
          <span class="flex icon">
            <CaretRight size={14} />
          </span>
        </li>
      {/each}
    </ul>
  {:else}
    <ul>
      <li><House size={14} /></li>
    </ul>
  {/if}
</nav>

<div class="template_columns card">
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
    // margin-bottom: -30px;
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
      font-size: 1.4rem;
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

  .card {
    padding: 20px;
    background-color: #fff;
    border-radius: var(--border-radius-big, 10px);
    border: 1px solid var(--border);
  }
</style>
