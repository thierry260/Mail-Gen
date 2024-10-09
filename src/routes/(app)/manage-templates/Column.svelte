<script>
  import Sortable from "sortablejs";
  import { onMount } from "svelte";
  import {
    DotsSixVertical,
    PencilSimple,
    TrashSimple,
    FolderSimple,
    File,
    CaretRight,
  } from "phosphor-svelte";

  export let categories = [];
  export let templates = [];
  export let level = 0;
  export let onSelect;
  export let onMove;
  export let selectedCategories = []; // Receive selectedCategories as a prop
  export let onRename; // Function to handle renaming a category
  export let onRemove; // Function to handle removing a category

  let categoriesContent, templatesContent;

  // Initialize Sortable.js for drag-and-drop functionality
  onMount(() => {
    new Sortable(categoriesContent, {
      group: "categories",
      animation: 150,
      handle: ".drag",
      onEnd: (event) => {
        const item = categories[event.oldIndex];
        const toCategory = categories[event.newIndex];
        onMove(item, categories[event.oldIndex], toCategory);
      },
    });
    new Sortable(templatesContent, {
      group: "templates",
      animation: 150,
      handle: ".drag",
      onEnd: (event) => {
        const item = templates[event.oldIndex];
        const toCategory = templates[event.newIndex];
        onMove(item, templates[event.oldIndex], toCategory);
      },
    });
  });
</script>

<div class="column">
  <span class="label">Subcategorieën</span>
  <div class="items categories" bind:this={categoriesContent}>
    {#if categories && categories.length}
      {#each categories as category (category.id)}
        <div
          class="item category category-{category.id} {selectedCategories.includes(
            category
          )
            ? 'active'
            : ''}"
          on:click={() => onSelect(level, category)}
        >
          <span class="icon drag">
            <DotsSixVertical size={16} />
          </span>
          <span class="icon type">
            <FolderSimple size={16} weight="bold" />
          </span>
          <span class="name">{category.name}</span>
          <span class="actions">
            <span
              class="icon rename"
              data-tooltip="Naam wijzigen"
              data-flow="top"
              on:click={(e) => {
                e.stopPropagation();
                onRename(category);
              }}
            >
              <PencilSimple size={14} />
            </span>
            <span
              class="icon remove"
              data-tooltip="Verwijderen"
              data-flow="top"
              on:click={(e) => {
                e.stopPropagation();
                onRemove(category);
              }}
            >
              <TrashSimple size={14} />
            </span>
          </span>
          <span class="icon caret">
            <CaretRight size={14} />
          </span>
        </div>
      {/each}
    {/if}
  </div>
  <input
    class="button simple add_button add_cat"
    placeholder="+ Categorie toevoegen"
  />
  <span class="label">Templates</span>
  <div class="items templates" bind:this={templatesContent}>
    {#if templates && templates.length}
      {#each templates as template (template.id)}
        <div
          class="item template template-{template.id} {selectedCategories.includes(
            template
          )
            ? 'active'
            : ''}"
        >
          <span class="icon drag">
            <DotsSixVertical size={16} />
          </span>
          <span class="icon type">
            <File size={16} weight="bold" />
          </span>
          <span class="name">{template.name}</span>
          <span class="actions">
            <span
              class="icon rename"
              data-tooltip="Naam wijzigen"
              data-flow="top"
              on:click={(e) => {
                e.stopPropagation();
                onRename(template, "template");
              }}
            >
              <PencilSimple size={14} />
            </span>
            <span
              class="icon remove"
              data-tooltip="Verwijderen"
              data-flow="top"
              on:click={(e) => {
                e.stopPropagation();
                onRemove(template, "template");
              }}
            >
              <TrashSimple size={14} />
            </span>
          </span>
        </div>
      {/each}
    {/if}
  </div>
  <input
    class="button simple add_button add_template"
    placeholder="+ Template toevoegen"
  />
</div>

<style lang="scss">
  .column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 300px;

    .label {
      margin-bottom: 0.5em;
      &:not(:first-child) {
        margin-top: 1em;
      }
    }

    .items {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 42px;

      &:empty::before {
        content: "Deze categorie heeft geen subcategorieën";
        --notice-hs: 214.29deg, 10%;
        --response-color: var(--notice-hs);
        background-color: hsl(var(--response-color), 98%);
        color: hsl(var(--response-color), 50%);
        border: 1px dashed hsl(var(--response-color), 75%);
        padding: 20px;
        border-radius: 5px;
        padding: 10px;
        text-align: center;
        font-size: 1.3rem;
        line-height: 1.5;
        /* min-height: 40px; */
        box-sizing: border-box;
      }

      &.templates {
        &:empty::before {
          content: "Deze categorie heeft geen templates";
        }
      }
    }

    .item {
      --padding: 13px 10px;
      display: flex;
      align-items: center;
      // gap: 5px;
      cursor: pointer;
      padding: 0;
      background-color: var(--gray-200);
      border-radius: 5px;
      outline: 1px solid transparent;
      font-size: 1.4rem;
      outline-offset: -1px;
      user-select: none;
      transition:
        background-color 0.2s ease-out,
        border-color 0.2s ease-out,
        color 0.2s ease-out;

      &.category {
        &:hover {
          background-color: #e0e0e0;
        }
      }

      &:hover {
        .actions {
          opacity: 1;
          pointer-events: auto;
        }
      }

      &.active.active {
        outline-color: var(--primary);
        background-color: hsl(from var(--primary) h s calc(l + 25));
        color: hsl(from var(--primary) h s calc(l - 60));
        // cursor: unset;

        // color: #fff;
        // background-color: hsl(from var(--primary) h s calc(l - 60));
      }

      .icon {
        display: flex;
      }

      .type {
        padding-right: 5px;
        color: var(--text);
      }

      .drag {
        padding: var(--padding);
        padding-right: 5px;
        cursor: grab;
      }
      .name {
        flex-grow: 1;
        outline: none;

        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-bottom: 1px;
      }
      .actions {
        display: flex;
        align-items: center;
        // gap: 2px;

        padding: var(--padding);
        padding-block: 5px;
        padding-left: 5px;

        &:not(:last-child) {
          padding-right: 5px;
        }

        color: var(--gray-500);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease-out;

        .icon {
          transition: color 0.2s ease-out;
          padding: 4px;
          cursor: pointer;
          &:hover {
            color: var(--gray-800);
          }
        }
      }
      .caret {
        padding-right: 10px;
        color: var(--gray-800);
      }

      &.template {
        cursor: unset;
      }
    }

    .add_button.add_button {
      cursor: unset;
      padding: 5px 0 10px;
      border: none;
      outline: none;
      box-shadow: none;
      font-size: 1.5rem;
    }

    &:first-child {
      .add_template,
      .label,
      .templates {
        display: none;
      }
    }
  }
</style>
