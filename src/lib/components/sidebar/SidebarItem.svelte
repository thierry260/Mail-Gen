<!-- src/lib/components/sidebar/SidebarItem.svelte -->
<script>
  export let item;
  export let currentId;
  export let currentType;
  import { goto } from "$app/navigation";
  import { CaretRight, DotsThreeVertical, Plus } from "phosphor-svelte";
  import { onMount } from "svelte";
  import Dropdown from "$lib/components/Dropdown.svelte";

  const viewTemplate = (templateId) => {
    goto(`/template/${templateId}`);
  };

  const viewCategory = (categoryId) => {
    goto(`/category/${categoryId}`);
  };

  const expandParents = (item, currentId, currentType) => {
    // Function unchanged from your provided code
  };

  const addItems = [
    {
      label: "Voeg template toe",
      class: "add_template",
      action: "templ_add",
      icon: "add",
    },
    { class: "separator" },
    {
      label: "Voeg categorie toe",
      class: "add_category",
      action: "cat_add",
      icon: "add",
    },
  ];

  const optionsItems = [
    {
      label: "Naam bewerken",
      class: "",
      action: "cat_modify-name",
      icon: "edit",
    },
    { class: "separator" },
    {
      label: "Verwijder",
      class: "remove",
      action: "cat_delete",
      icon: "delete",
    },
  ];

  function closeDropdown() {
    const event = new CustomEvent("close-dropdown", {
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
  }

  function triggerDropdown(id) {
    console.log("Dispatching toggle-dropdown event with id:", id);
    const event = new CustomEvent("toggle-dropdown", {
      detail: id,
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
  }

  function handleCategoryAdded(event) {
    const { parentCategoryId, newCategory } = event.detail;
    if (item.id === parentCategoryId) {
      item = {
        ...item,
        sub: [...item.sub, newCategory],
      };
    }
    item = { ...item }; // Trigger reactivity
  }

  function handleCategoryModified(event) {
    const { categoryId, newName } = event.detail;
    if (item.id === categoryId) {
      console.log("handleCategoryModified");
      item = {
        ...item,
        name: newName,
      };
    }
    item = { ...item }; // Trigger reactivity
  }

  function handleCategoryDeleted(event) {
    const { categoryId } = event.detail;
    if (item.sub) {
      item.sub = item.sub.filter((subItem) => subItem.id !== categoryId);
    }
    item = { ...item }; // Trigger reactivity
  }

  onMount(() => {
    expandParents(item, currentId, currentType);
    window.addEventListener("category-added", handleCategoryAdded);
    window.addEventListener("category-modified", handleCategoryModified);
    window.addEventListener("category-deleted", handleCategoryDeleted);
    return () => {
      window.removeEventListener("category-added", handleCategoryAdded);
      window.removeEventListener("category-modified", handleCategoryModified);
      window.removeEventListener("category-deleted", handleCategoryDeleted);
    };
  });

  $: isActiveCategory = currentType === "category" && item.id === currentId;
  $: isActiveTemplate =
    currentType === "template" &&
    item.templates &&
    item.templates.some((template) => template.id === currentId);
</script>

<div class="accordion_item" id={`accordion_item_${item.id}`}>
  <button
    class="accordion_header {isActiveCategory ? 'active' : ''}"
    on:click={() => {
      item.open = !item.open;
      if (item.open || 1 == 1) {
        viewCategory(item.id);
      }
    }}
    on:mouseleave={() => {
      closeDropdown();
    }}
    class:open={item.open}
  >
    <CaretRight size={12} class="dropdown" /><span class="name"
      >{item.name}</span
    ><span class="actions"
      ><button
        on:click={(event) => {
          event.stopPropagation();
          triggerDropdown(`options_${item.id}`);
        }}
      >
        <DotsThreeVertical size={18} data-action="options" />
        <Dropdown
          items={optionsItems}
          id={`options_${item.id}`}
          categoryId={item.id}
        />
      </button>
      <button
        on:click={(event) => {
          event.stopPropagation();
          triggerDropdown(`add_${item.id}`);
        }}
      >
        <Plus size={16} data-action="add" />
        <Dropdown items={addItems} id={`add_${item.id}`} categoryId={item.id} />
      </button></span
    >
  </button>
  {#if item.open}
    {#if item.sub}
      <div class="accordion_content">
        {#each item.sub as subItem}
          <svelte:self item={subItem} {currentId} {currentType} />
        {/each}
      </div>
    {/if}
    {#if item.templates}
      <div class="accordion_templates">
        {#each item.templates as template}
          <button
            class="template {currentType === 'template' &&
            template.id === currentId
              ? 'active'
              : ''}"
            on:click={() => {
              template.open = true;
              viewTemplate(template.id);
            }}
            class:open={template.open}
          >
            {template.name}
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
  .accordion_item {
    display: flex;
    flex-direction: column;
    gap: 5px;
    .accordion_header,
    .template {
      cursor: pointer;
      padding: 10px;
      background-color: transparent;
      border: 1px solid transparent;
      border-radius: 10px;
      font-size: 1.5rem;
      width: 100%;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 5px;
      transition:
        border-color 0.1s ease-out,
        background-color 0.1s ease-out;
      color: #fff;
      .name {
        flex-grow: 1;
      }
      .actions {
        display: flex;
        align-content: center;
        gap: 5px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease-out;
        position: relative;
        > button {
          position: relative;
          background-color: transparent;
          border: none;
          min-width: none;
          padding: 0;
          color: inherit;
          font-family: inherit;
          pointer-events: auto;
          cursor: pointer;
        }
      }
      &:hover {
        .actions {
          opacity: 1;
          pointer-events: auto;
        }
      }
      &.active {
        background-color: rgba(0, 0, 0, 0.2);
      }
      &:not(.active):hover {
        border-color: rgba(255, 255, 255, 0.6);
      }
    }
    .accordion_header .dropdown {
      transition: transform 0.2s ease-out;
    }
    .accordion_header.open .dropdown {
      transform: rotate(90deg);
    }

    .accordion_templates {
      margin-left: 15px;
      display: flex;
      flex-direction: column;
      gap: inherit;

      &:empty {
        display: none;
      }
    }

    .accordion_content {
      margin-left: 15px;
      display: flex;
      flex-direction: column;
      gap: 5px;

      &:empty {
        display: none;
      }
    }
  }
</style>
