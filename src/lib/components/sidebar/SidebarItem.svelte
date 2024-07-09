<!-- src/lib/components/sidebar/SidebarItem.svelte -->
<script>
  export let item;
  export let currentId;
  export let currentType;
  import { goto } from "$app/navigation";
  import { CaretRight, DotsThreeVertical, Plus } from "phosphor-svelte";
  import { onMount } from "svelte";

  const viewTemplate = (templateId) => {
    goto(`/template/${templateId}`); // Navigate to the template details page
  };

  const viewCategory = (categoryId) => {
    goto(`/category/${categoryId}`); // Navigate to the category details page
  };

  const expandParents = (item, currentId, currentType) => {
    if (currentType === "category" && item.id === currentId) {
      item.open = true;
      return true;
    }

    if (currentType === "template" && item.templates) {
      for (const template of item.templates) {
        if (template.id === currentId) {
          item.open = true;
          return true;
        }
      }
    }

    if (item.sub) {
      for (const subItem of item.sub) {
        if (expandParents(subItem, currentId, currentType)) {
          item.open = true;
          return true;
        }
      }
    }

    return false;
  };

  onMount(() => {
    expandParents(item, currentId, currentType);
  });

  $: isActiveCategory = currentType === "category" && item.id === currentId;
  $: isActiveTemplate =
    currentType === "template" &&
    item.templates &&
    item.templates.some((template) => template.id === currentId);
</script>

<div class="accordion_item">
  <button
    class="accordion_header {isActiveCategory ? 'active' : ''}"
    on:click={() => {
      item.open = !item.open;
      if (item.open) {
        viewCategory(item.id);
      }
    }}
    class:open={item.open}
  >
    <CaretRight size={12} class="dropdown" /><span class="name"
      >{item.name}</span
    ><span class="actions"
      ><DotsThreeVertical size={18} data-action="options" /><Plus
        size={16}
        data-action="add"
      /></span
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
          <div
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
          </div>
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
      color: var(--gray-600);
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
      }
      &:hover {
        .actions {
          opacity: 1;
        }
      }
      &.active {
        background-color: var(--gray-200);
      }
      &:not(.active):hover {
        border-color: var(--gray-300);
      }
    }
    .accordion_header .dropdown {
      transition: transform 0.2s ease-out;
    }
    .accordion_header.open .dropdown {
      transform: rotate(90deg);
    }

    .template {
    }
    .accordion_templates {
      margin-left: 15px;
    }

    .accordion_content {
      margin-left: 15px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
  }
</style>
