<script>
  import Column from "./Column.svelte";
  import { templatesStore } from "$lib/stores/templates";
  import { CaretRight, House } from "phosphor-svelte";
  import { createNewTemplate, generateId } from "$lib/utils/create";
  import toast_ from "svelte-french-toast";
  import toast from "svelte-french-toast";
  import UndoToast from "./UndoToast.svelte";
  import { updateDoc, doc } from "firebase/firestore";
  import { db } from "$lib/firebase";
  import { tick } from "svelte";

  let selectedCategories = [];
  let lastLevel = -1;

  let categories = []; // Declare categories locally
  let previousTemplates = [];
  let undoTimeout;
  let columnsContainer;

  $: $templatesStore = [...$templatesStore]; // This forces reactivity by reassigning the store

  // Subscribe to the templatesStore
  $: {
    categories = $templatesStore; // Update local categories when store changes
  }

  // Add event listener for undo-toast
  document.addEventListener("undo-toast", async () => {
    // Restore previousTemplates to templatesStore
    templatesStore.set(previousTemplates);
    // await tick(); // Wait for DOM updates

    setTimeout(() => {
      refreshDOM();
    }, 20);
    console.log("Undo triggered via undo-toast event");

    // Clear the timeout to avoid saving changes after undo
    clearTimeout(undoTimeout);
  });

  // Function to remove unnecessary content property before saving
  function removeContentProperty(arr) {
    arr.forEach((item) => {
      if (item.open) {
        delete item.open;
      }
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

  let currentToastId = null; // Store the current toast ID

  $: if ($templatesStore) {
    const currentTemplates = JSON.parse(JSON.stringify($templatesStore));

    // Check if templates have changed
    if (
      previousTemplates.length > 0 &&
      JSON.stringify(previousTemplates) !== JSON.stringify(currentTemplates)
    ) {
      // If a toast is already shown, dismiss it and clear the timeout
      if (currentToastId) {
        toast_.dismiss(currentToastId); // Dismiss the previous toast
        clearTimeout(undoTimeout); // Clear any previous timeout
      }

      // Trigger a new toast with the UndoToast component and store its ID
      currentToastId = toast_(UndoToast, {
        duration: 5000,
        position: "bottom-right",
      });

      // Set a timeout to save changes after 5 seconds, if undo is not triggered
      undoTimeout = setTimeout(() => {
        // Remove content properties from templates before saving
        const newCategoriesArray = removeContentProperty(currentTemplates);

        // Save to Firestore or localStorage
        console.log("Saving templates to Firestore", newCategoriesArray);
        const docRef = doc(db, "workspaces", localStorage.getItem("workspace"));

        updateDoc(docRef, { categories: newCategoriesArray })
          .then(() =>
            toast.success("Wijzigingen opgeslagen", {
              position: "bottom-right",
            })
          )
          .catch((error) => console.error("Error saving templates:", error));

        // Reset the currentToastId after saving
        // currentToastId = null;
      }, 5000);
    }
  }

  const navigateToCategory = (index) => {
    if (index >= 0) {
      selectCategory(index, selectedCategories[index]);
    } else {
      selectCategory(0, false);
    }
  };

  const selectCategory = async (level, selectedCategory) => {
    var temp_selectedCategories = selectedCategories;
    selectedCategories = [];

    await tick();
    selectedCategories = temp_selectedCategories;
    if (selectedCategory) {
      selectedCategories = selectedCategories.slice(0, level);
      selectedCategories.push(selectedCategory);

      setTimeout(() => {
        const container = document.querySelector(".template_columns");
        if (container) {
          const visibleColumns = container.children.length;
          const columnWidth = container.offsetWidth / visibleColumns;
          const scrollPosition = columnWidth * level;
          const maxScrollPosition =
            container.scrollWidth - container.clientWidth;
          container.scrollTo({
            left: maxScrollPosition,
            behavior: "smooth",
          });
        }
        lastLevel = level;
      }, 20);
    } else {
      selectedCategories = [];

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
    }
  };

  const moveItem = async (
    type,
    fromCategoryId,
    fromIndex,
    toCategoryId,
    toIndex,
    movedItemId,
    revert = false
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
    previousTemplates = JSON.parse(JSON.stringify($templatesStore)); // Make a deep copy

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
        console.log("hoofdcategorie -", item, movedItemId);
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

      console.log(fromParent);

      if (type === "categories") {
        // Remove item from the correct place
        if (fromParent === false) {
          // Top-level category
          if (fromIndex >= 0 && fromIndex < currentTemplates.length) {
            console.log(
              `hoofdcategorie -${itemToMove.name} removed from index ${fromIndex}`
            );
            currentTemplates.splice(fromIndex, 1);
          } else {
            console.warn("fromIndex out of bounds:", fromIndex);
          }
        } else if (fromIndex >= 0 && fromIndex < fromParent.sub.length) {
          // console.log("before remove sub", fromParent.sub, fromIndex);
          fromParent.sub.splice(fromIndex, 1); // Remove from sub-category
          // console.log("after remove sub", fromParent.sub);
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
        console.log("hoofdcategorie -------------------: ");
        console.log("hoofdcategorie fromParent: ", fromParent);
        console.log("hoofdcategorie toIndex: ", toIndex);
        console.log("hoofdcategorie itemToMove: ", itemToMove);
        if (fromParent === false) {
          // If moving within top-level categories
          console.log(
            `hoofdcategorie moved to - ${itemToMove.name} added to index ${toIndex}`
          );
          currentTemplates.splice(toIndex, 0, itemToMove); // Insert at the corrected index
        } else if (fromParent && type === "categories") {
          console.log({
            type,
            fromCategoryId,
            toCategoryId,
            toIndex,
            movedItemId,
          });
          // If moving a subcategory to the main level
          if (toIndex >= 0 && toIndex <= currentTemplates.length) {
            console.log(
              `Moving subcategory ${itemToMove.name} to top level at index ${toIndex}`
            );
            currentTemplates.splice(toIndex, 0, itemToMove); // Insert at the main level
          } else {
            console.warn("toIndex out of bounds for top-level:", toIndex);
          }
          // Remove the item from its original parent
          const fromIndexNumber = fromParent.sub.indexOf(itemToMove);
          if (fromIndexNumber >= 0) {
            fromParent.sub.splice(fromIndexNumber, 1); // Remove from original parent
          }
        } else if (type === "categories") {
          fromParent.sub.splice(toIndex, 0, itemToMove); // Add to the same parent at new position
        } else if (type === "templates") {
          fromParent.templates.splice(toIndex, 0, itemToMove);
        }
      }
    }

    templatesStore.set([...currentTemplates]);

    if (revert) {
      console.log("revert");

      setTimeout(() => {
        templatesStore.set([...previousTemplates]);
        refreshDOM();
        clearTimeout(undoTimeout);
        toast_.dismiss(currentToastId); // Dismiss the previous toast
      }, 20);

      toast.error("Een categorie kan niet zijn eigen subcategorie zijn", {
        position: "bottom-right",
      });
    }
  };

  const onRename = (item, type = "category") => {
    previousTemplates = JSON.parse(JSON.stringify($templatesStore)); // Make a deep copy

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
        // refreshDOM();
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
    previousTemplates = JSON.parse(JSON.stringify($templatesStore)); // Make a deep copy

    const typeFormatted = type === "category" ? "categorie" : "template";
    if (
      confirm(
        `Weet je zeker dat je ${typeFormatted} "${item.name}" wilt verwijderen?`
      )
    ) {
      console.log("remove - item: ", item);
      console.log("remove - selectedCategories: ", selectedCategories);
      // Remove item from selectedCategories if it exists
      const selectedIndex = selectedCategories.findIndex(
        (selected) => selected.id === item.id
      );
      if (selectedIndex !== -1) {
        selectedCategories.splice(selectedIndex, 1); // Remove the item
        console.log(`Removed ${item.name} from selectedCategories`);

        console.log({ selectedCategories });

        document
          .querySelector(`.column[data-column-id="${item.id}"]`)
          ?.remove();
      }

      if (type === "template") {
        // Logic to remove the template recursively
        removeTemplate(item.id);
      } else {
        // Logic to remove the category and its subcategories recursively
        removeCategoryAndSubcategories(item.id);
      }
      console.log(`Item ${item.name} removed`);
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
    previousTemplates = JSON.parse(JSON.stringify($templatesStore)); // Make a deep copy

    const newCategory = { id: generateId(), name, sub: [], templates: [] };
    if (!categoryId) {
      templatesStore.update((cats) => [...cats, newCategory]);
      console.log(categoryId);
      refreshDOM();
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
    previousTemplates = JSON.parse(JSON.stringify($templatesStore)); // Make a deep copy

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

  const refreshDOM = async () => {
    await tick();
    console.log({ selectedCategories });
    selectedCategories.forEach(async (selectedCategory, index) => {
      await tick();
      const categoryElement = document.querySelector(
        `.category.category-${selectedCategory.id}`
      );
      if (categoryElement) {
        categoryElement.classList.add("active");
        console.log(
          `Category element .category.category-${selectedCategory.id} found.`
        );
      } else {
        console.error(
          `Category element .category.category-${selectedCategory.id} not found.`
        );
        return false; // Filter out this category
      }
    });
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
      <li><House size={14} />Hoofdcategorieën</li>
    </ul>
  {/if}
</nav>

<div class="template_columns card" bind:this={columnsContainer}>
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

  {#each selectedCategories as selectedCategory, index (selectedCategory.id)}
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

  .template_columns.template_columns {
    --gap: 2rem;
    --columns: 3;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    display: grid;
    overflow-x: auto;
    grid-auto-columns: calc(
      (100% / var(--columns)) - (var(--gap, 2rem) * 2 / 3)
    );
    grid-auto-flow: column;
    grid-column-gap: var(--gap, 2rem);
    grid-template-rows: minmax(0, 1fr);

    // -ms-overflow-style: none; /* Internet Explorer 10+ */
    // scrollbar-width: none; /* Firefox */
    // &::-webkit-scrollbar {
    //   display: none; /* Safari and Chrome */
    // }

    /* ===== Scrollbar CSS ===== */
    // scrollbar-width: auto;
    // scrollbar-color: #ebebeb #ffffff;

    /* Chrome, Edge, and Safari */
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.15);
      border-radius: 10px;
      border: px solid transparent;
    }

    @media (max-width: $md) {
      --columns: 2;
    }
    @media (max-width: $sm) {
      --columns: 1;
      grid-auto-columns: calc((100% / var(--columns)));
    }
  }
  :global(.template_columns > .column) {
    flex: 1;
    width: 100%;
    padding-right: var(--gap, 2rem);
    border-right: 1px solid var(--border);
    transition:
      padding-right 0.2s ease-out,
      border-color 0.2s ease-out;
    &:last-child:not(:first-child) {
      padding-right: 0;
      border-color: transparent;
    }

    @media (max-width: $sm) {
      padding-right: 0;
      border-color: transparent;
    }
  }

  .card {
    padding: 20px;
    background-color: #fff;
    border-radius: var(--border-radius-big, 10px);
    border: 1px solid var(--border);
  }
</style>
