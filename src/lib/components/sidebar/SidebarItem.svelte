<!-- src/lib/components/sidebar/SidebarItem.svelte -->
<script>
  import { switchMobileNav } from "$lib/utils/utils.js";
  export let item;
  export let currentId;
  export let currentType;
  let dropdownState = false;
  import { goto } from "$app/navigation";
  import { CaretRight, DotsThreeVertical, Plus } from "phosphor-svelte";
  import Dropdown from "$lib/components/Dropdown.svelte";
  import { templatesStore } from "$lib/stores/templates";
  import { onDestroy } from "svelte";

  let unsubscribe;

  unsubscribe = templatesStore.subscribe((value) => {
    const itemFromStore = value.find((cat) => cat.id === item.id);
    if (itemFromStore) {
      item = itemFromStore;
    }
  });

  onDestroy(() => {
    unsubscribe();
  });

  const viewTemplate = (templateId) => {
    switchMobileNav("browse");
    goto(`/template/${templateId}`);
  };

  const viewCategory = (categoryId) => {
    switchMobileNav("browse");
    goto(`/category/${categoryId}`);
  };

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

  $: isActiveCategory = currentType === "category" && item.id === currentId;
  $: isActiveTemplate =
    currentType === "template" &&
    item.templates &&
    item.templates.some((template) => template.id === currentId);
</script>

{#if Object.keys(item).length > 0}
  <div class="accordion_item" id={`accordion_item_${item.id}`}>
    <button
      class="accordion_header {isActiveCategory ? 'active' : ''}"
      on:click={() => {
        viewCategory(item.id);
        if (!item.open) {
          item.open = true;
        }
      }}
      on:mouseleave={() => {
        closeDropdown();
      }}
      class:open={item.open}
    >
      <div
        class="dropdown_outer"
        on:click={(e) => {
          e.stopPropagation();
          item.open = !item.open;
        }}
      >
        <CaretRight size={12} class="dropdown" />
      </div>
      <span class="name">{item.name}</span><span class="actions"
        ><button
          on:click={(event) => {
            event.stopPropagation();
            dropdownState = !dropdownState;
          }}
        >
          <DotsThreeVertical size={18} data-action="options" />
          <Dropdown
            bind:item
            open={dropdownState}
            items={[
              {
                label: "Naam bewerken",
                class: "",
                action: "cat_modify-name",
                icon: "edit",
              },
              { class: "separator" },
              {
                label: "Verwijderen",
                class: "remove",
                action: "cat_delete",
                icon: "delete",
              },
            ]}
            id={`options_${item.id}`}
            contentId={item.id}
          />
        </button>
        <button
          on:click={(event) => {
            event.stopPropagation();
            triggerDropdown(`add_${item.id}`);
          }}
        >
          <Plus size={16} data-action="add" />
          <Dropdown
            bind:item
            items={[
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
            ]}
            id={`add_${item.id}`}
            contentId={item.id}
          />
        </button></span
      >
    </button>
    {#if item.open}
      {#if item.sub}
        <div class="accordion_content">
          {#each item.sub as subItem}
            <svelte:self bind:item={subItem} {currentId} {currentType} />
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
              on:mouseleave={() => {
                closeDropdown();
              }}
              class:open={template.open}
            >
              <span class="name">{template.name}</span>
              <span class="actions"
                ><button
                  on:click={(event) => {
                    event.stopPropagation();
                    dropdownState = !dropdownState;
                  }}
                >
                  <DotsThreeVertical size={18} data-action="options" />
                  <Dropdown
                    bind:item
                    open={dropdownState}
                    items={[
                      {
                        label: "Template bewerken",
                        class: "",
                        action: "templ_edit",
                        icon: "edit",
                      },
                      { class: "separator" },
                      {
                        label: "Verwijderen",
                        class: "remove",
                        action: "templ_delete",
                        icon: "delete",
                      },
                    ]}
                    id={`template_${template.id}`}
                    contentId={template.id}
                  />
                </button></span
              >
            </button>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
{/if}

<style lang="scss">
  .accordion_item {
    display: flex;
    flex-direction: column;
    gap: inherit;
    @media (max-width: $lg) {
      gap: 10px;
    }
    .accordion_header,
    .template {
      cursor: pointer;
      padding: 10px;
      min-height: 44px;
      background-color: transparent;
      border: 1px solid transparent;
      border-radius: 10px;
      font-size: 1.4rem;
      width: 100%;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 8px;
      transition:
        border-color 0.2s ease-out,
        background-color 0.2s ease-out,
        color 0.2s ease-out;
      color: inherit;
      .name {
        flex-grow: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: 100%;
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
      &::before {
        content: "";
        height: 0;
        width: 5px;
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
        background: var(--primary);
        position: absolute;
        left: 0;
        transition: height 0.2s ease-out;
      }
      &.active {
        // background-color: rgba(0, 0, 0, 0.12);
        border-color: var(--primary);
        background-color: hsl(from var(--primary) h s calc(l + 25));
        color: hsl(from var(--primary) h s calc(l - 60));

        .dropdown_outer {
          background-color: transparent;
          // color: hsl(from var(--primary) h s calc(l - 70));
        }
        &::before {
          height: 34px;
        }
      }
      &:not(.active):hover {
        border-color: rgba(0, 0, 0, 0.1);
      }
    }
    .accordion_header .dropdown {
      transition: transform 0.2s ease-out;
    }
    .accordion_header.open .dropdown_outer {
      transform: rotate(90deg);
    }
    .accordion_header .dropdown_outer {
      padding: 4px;
      // border: 1px solid rgba(255, 255, 255, 0.2);
      background-color: rgba(0, 0, 0, 0.08);
      border-radius: 7px;
      display: flex;
      transition:
        transform 0.2s ease-out,
        background-color 0.2s ease-out;
      @media (max-width: $lg) {
        padding: 8px;
      }
    }

    .accordion_templates {
      margin-left: 30px;
      display: flex;
      flex-direction: column;
      gap: 5px;

      &:empty {
        display: none;
      }
    }

    .accordion_content {
      margin-left: 30px;
      display: flex;
      flex-direction: column;
      gap: 5px;

      &:empty {
        display: none;
      }
    }
  }
</style>
