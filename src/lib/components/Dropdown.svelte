<!-- src/lib/components/Dropdown.svelte -->
<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { deleteCategory, deleteTemplate } from "$lib/utils/delete";
  import { createNewTemplate, createCategory } from "$lib/utils/create";
  import { updateCategoryName } from "$lib/utils/set";
  import { Plus, TrashSimple, PencilSimple, Star } from "phosphor-svelte";
  import { templatesStore } from "$lib/stores/templates";
  import { user } from "$lib/stores/user";
  import toast from "svelte-french-toast";

  let hasActiveSubscription = false;
  let currentUser;
  $: {
    currentUser = $user;

    if (currentUser && currentUser.subscriptionActive === true) {
      hasActiveSubscription = true;
    }
  }

  // Icons map for dynamic rendering
  const icons = {
    add: Plus,
    delete: TrashSimple,
    edit: PencilSimple,
    star: Star,
  };

  export let item;
  export let items = [];
  export let id = ""; // Unique ID for the dropdown
  export let contentId = ""; // Unique ID for the category
  export let open = false;

  const toggleDropdown = () => {
    open = !open;
  };

  const closeDropdown = () => {
    open = false;
  };

  // Handle click events on dropdown items
  async function handleItemClick(action) {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    console.log(`Clicked item with action: ${action}`);

    if (action === "templ_add") {
      const newTemplateName = prompt(
        "Geef een naam in voor de nieuwe template:"
      );

      if (!newTemplateName) return;
      const newTemplateId = await createNewTemplate(contentId, newTemplateName);

      console.log(newTemplateId);
      if (newTemplateId) {
        const newTemplate = { name: newTemplateName, id: newTemplateId };
        item = {
          ...item,
          templates: [...item.templates, newTemplate],
          open: true,
        };
        toast.success("Template toegevoegd", {
          position: "bottom-right",
        });
        goto(`/template/${newTemplateId}#edit`);
      }
      closeDropdown();
    } else if (action === "cat_delete") {
      if (
        confirm(
          "Weet je zeker dat je deze categorie wilt verwijderen? Alle subcategorieën en templates zullen tevens worden verwijderd."
        )
      ) {
        deleteCategory(contentId).then(() => {
          item = {};
          toast.success("Categorie verwijderd", {
            position: "bottom-right",
          });
          closeDropdown();
        });
      }
    } else if (action === "cat_modify-name") {
      const newName = prompt(
        "Geef een nieuwe naam voor de categorie:",
        item.name
      );
      if (newName) {
        updateCategoryName(contentId, newName).then(() => {
          item.name = newName;
          toast.success("Categorienaam gewijzigd", {
            position: "bottom-right",
          });
          closeDropdown();
        });
      }
    } else if (action === "cat_add") {
      const newCategoryName = prompt(
        "Geef een naam in voor de nieuwe categorie:"
      );
      if (newCategoryName) {
        createCategory(contentId, newCategoryName).then((newCategory) => {
          item = {
            ...item,
            sub: [...item.sub, newCategory],
          };
          toast.success("Categorie toegevoegd", {
            position: "bottom-right",
          });
          closeDropdown();
        });
      }
    } else if (action === "templ_edit") {
      goto(`/template/${contentId}#edit`);
    } else if (action === "templ_delete") {
      const confirmDelete = window.confirm(
        "Weet je zeker dat je deze template wilt verwijderen?"
      );
      if (confirmDelete) {
        deleteTemplate(contentId)
          .then(() => {
            toast.success("Template verwijderd", {
              position: "bottom-right",
            });

            const templateCatId = removeTemplateFromStore(contentId);

            if ($page.params.id && $page.params.id == contentId) {
              goto(`/category/${templateCatId}`);
            }
          })
          .catch((error) => {
            console.error("Error deleting template:", error);

            toast.error(error.message, {
              position: "bottom-right",
            });
          });
      }
    }
  }

  // Listen for custom events to toggle the dropdown
  function handleToggle(event) {
    console.log({ event, id });
    if (event.detail === id) {
      toggleDropdown();
    }
  }

  const removeTemplateFromStore = (id) => {
    let categoryId = null;

    templatesStore.update((categories) => {
      const removeNestedTemplate = (items) => {
        for (const item of items) {
          if (item.templates) {
            const templateIndex = item.templates.findIndex(
              (template) => template.id === id
            );
            if (templateIndex !== -1) {
              item.templates.splice(templateIndex, 1); // Remove the template
              categoryId = item.id; // Store the category id
              return true; // Exit after removing
            }
          }
          if (item.sub) {
            if (removeNestedTemplate(item.sub)) {
              return true; // Exit after removing
            }
          }
        }
        return false;
      };
      removeNestedTemplate(categories);
      return categories;
    });

    return categoryId;
  };
</script>

<ul class="dropdown_list {open ? 'open' : ''}">
  {#each items as item}
    {#if item.class === "separator"}
      <li class="separator"></li>
    {:else}
      <li class={item.class} on:click={() => handleItemClick(item.action)}>
        {#if item.icon && icons[item.icon]}
          <svelte:component this={icons[item.icon]} size={18} />
        {/if}
        {item.label}
      </li>
    {/if}
  {/each}
</ul>

<!-- Close dropdown on outside click -->
<svelte:window
  on:toggle-dropdown={handleToggle}
  on:close-dropdown={closeDropdown}
  on:click={() => open && closeDropdown()}
/>

<style>
  .dropdown_list {
    position: absolute;
    top: calc(100% - 10px);
    transform: translateY(0);
    right: -5px;
    background: #fff;
    opacity: 0;
    border-radius: 5px;
    border: 1px solid var(--line-light, #e6e6e6);
    pointer-events: none;
    padding: 10px;
    transition:
      opacity 0.2s ease-out,
      transform 0.2s ease-out;
    white-space: nowrap;
    min-width: 170px;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 9999;
    color: var(--text);
  }

  .dropdown_list::before {
    content: "";
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 5px 6px 5px;
    border-color: transparent transparent #fff transparent;
    position: absolute;
    right: 8px;
    top: 0px;
    transform: translateY(-100%);
    z-index: 1;
  }

  .dropdown_list::after {
    content: "";
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 6px 7px 6px;
    border-color: transparent transparent #e6e6e6 transparent;
    position: absolute;
    right: 7px;
    top: 0px;
    transform: translateY(-100%);
  }

  .dropdown_list.open {
    transform: translateY(10px);
    opacity: 1;
    pointer-events: auto;
  }

  .dropdown_list li {
    position: relative;
    padding: 8px 10px;
    border-radius: 5px;
    border: 1px solid transparent;
    cursor: pointer;
    display: flex;
    gap: 8px;
    align-items: center;
    transition:
      color 0.2s ease-out,
      background-color 0.2s ease-out;
  }

  .dropdown_list li:hover {
    background-color: var(--background, #f5f5f5);
    color: var(--text, #333);
  }

  .dropdown_list li.remove {
    color: var(--error, #f00);
  }

  .dropdown_list li.remove:hover {
    background-color: hsl(from var(--error, #f00) h s calc(l + 45));
  }

  .dropdown_list li.separator {
    height: 1px;
    background-color: #e6e6e6;
    margin: 4px 0;
    padding: 0;
    border: none;
    pointer-events: none;
  }

  .dropdown_list li span {
    display: inline-block;
    margin-right: 8px;
  }
</style>
