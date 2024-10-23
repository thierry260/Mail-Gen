<script>
  import { onMount, onDestroy } from "svelte";
  import Sortable from "sortablejs";
  import {
    DotsSixVertical,
    PencilSimple,
    TrashSimple,
    FolderSimple,
    File,
    CaretRight,
  } from "phosphor-svelte";
  import { templatesStore } from "$lib/stores/templates";

  export let id = "";
  export let selectedCategory = "";
  export let selectedCategories = [];
  export let categories = [];
  export let templates = [];
  export let level = 0;
  export let onSelect;
  export let onRename;
  export let onRemove;
  export let onMove;
  export let onAddCategory;
  export let onAddTemplate;

  let categoriesContent, templatesContent;
  let newCategoryName = "";
  let newTemplateName = "";

  // Sortables instances
  let categoriesSortable;
  let templatesSortable;

  const initializeSortables = () => {
    if (categoriesContent) {
      categoriesSortable = new Sortable(categoriesContent, {
        group: "categories",
        animation: 150,
        handle: ".drag",
        onEnd: (event) => {
          // console.log(event);
          let revert = false;
          const fromCategoryId = event.from.dataset.id || null;
          const fromIndex = event.oldIndex;
          const toCategoryId =
            event.to.dataset.id === event.from.dataset.id
              ? null
              : event.to.dataset.id;
          const toIndex = event.newIndex;
          const movedItemId = event.item.dataset.id;

          // Check if the moved item is the same as the destination category
          if (movedItemId === toCategoryId) {
            console.log(
              `Move reverted: Moved item ${movedItemId} cannot be in the same category.`
            );
            revert = true;
          }

          console.log("hoofdcategorie to index Column: ", toIndex);

          // Trigger onMove only if fromCategoryId is not equal to toCategoryId or fromIndex differs from toIndex
          if (fromCategoryId !== toCategoryId || fromIndex !== toIndex) {
            console.log({
              fromCategoryId,
              fromIndex,
              toCategoryId,
              toIndex,
              movedItemId,
              revert,
            });

            onMove(
              "categories",
              fromCategoryId,
              fromIndex,
              toCategoryId,
              toIndex,
              movedItemId,
              revert
            );
          }
        },
      });
    }

    if (templatesContent) {
      templatesSortable = new Sortable(templatesContent, {
        group: "templates",
        animation: 150,
        handle: ".drag",
        onEnd: (event) => {
          const fromCategoryId = event.from.dataset.id || null;
          const fromIndex = event.oldIndex;
          const toCategoryId =
            event.to.dataset.id === event.from.dataset.id
              ? null
              : event.to.dataset.id;
          const toIndex = event.newIndex;
          const movedItemId = event.item.dataset.id;

          // Trigger onMove only if fromCategoryId is not equal to toCategoryId or fromIndex differs from toIndex
          if (fromCategoryId !== toCategoryId || fromIndex !== toIndex) {
            console.log({
              fromCategoryId,
              fromIndex,
              toCategoryId,
              toIndex,
              movedItemId,
            });

            onMove(
              "templates",
              fromCategoryId,
              fromIndex,
              toCategoryId,
              toIndex,
              movedItemId
            );
          }
        },
      });
    }
  };

  // Initialize Sortables on mount
  onMount(() => {
    console.log("onMount Column");
    initializeSortables();
  });

  // Cleanup Sortables on destroy
  onDestroy(() => {
    categoriesSortable && categoriesSortable.destroy();
    templatesSortable && templatesSortable.destroy();
  });

  const addCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName, id);
      newCategoryName = ""; // Clear input after adding
    }
  };

  const addTemplate = () => {
    if (newTemplateName.trim()) {
      onAddTemplate(newTemplateName, id);
      newTemplateName = ""; // Clear input after adding
    }
  };
</script>

<div class="column">
  {#if level == 0}
    <span class="label">Categorieën</span>
  {:else}
    <span class="label">Subcategorieën</span>
  {/if}
  <div class="items categories">
    <div
      class="items_inner"
      bind:this={categoriesContent}
      data-id={id}
      data-type={"categories"}
    >
      {#if categories && categories.length}
        {#each categories as category (category.id)}
          <div
            class="item category category-{category.id} {selectedCategories.includes(
              category
            )
              ? 'active'
              : ''}"
            data-id={category.id}
            on:click={() => onSelect(level, category)}
          >
            <span class="icon drag"><DotsSixVertical size={16} /></span>
            <span class="icon type"
              ><FolderSimple size={16} weight="bold" /></span
            >
            <span class="name">{category.name}</span>
            <span class="actions">
              <span
                class="icon rename"
                on:click={(e) => {
                  e.stopPropagation();
                  onRename(category);
                }}
              >
                <PencilSimple size={14} />
              </span>
              <span
                class="icon remove"
                on:click={(e) => {
                  e.stopPropagation();
                  onRemove(category);
                }}
              >
                <TrashSimple size={14} />
              </span>
            </span>
            <span class="icon caret"><CaretRight size={14} /></span>
          </div>
        {/each}
      {/if}
    </div>
  </div>
  <div class="add_button_outer">
    <input
      class="button simple add_button add_cat"
      placeholder="+ Categorie"
      bind:value={newCategoryName}
      on:keypress={(e) => e.key === "Enter" && addCategory()}
    />
    <button class="button basic" on:click={addCategory}>Toevoegen</button>
  </div>

  {#if level > 0}
    <span class="label">Templates</span>
    <div class="items templates">
      <div
        class="items_inner"
        bind:this={templatesContent}
        data-id={id}
        data-type={"templates"}
      >
        {#if templates && templates.length}
          {#each templates as template (template.id)}
            <div
              class="item template template-{template.id} {selectedCategory.id ===
              template.id
                ? 'active'
                : ''}"
              data-id={template.id}
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
      <div class="add_button_outer">
        <input
          class="button simple add_button add_temp"
          placeholder="+ Template"
          bind:value={newTemplateName}
          on:keypress={(e) => e.key === "Enter" && addTemplate()}
        />
        <button class="button basic" on:click={addTemplate}>Toevoegen</button>
      </div>
    </div>
  {/if}
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

    .add_button_outer {
      display: grid;
      grid-template-rows: max-content 0fr;
      height: min-content;
      transition: grid-template-rows 0.2s ease-out;
      .add_button.add_button {
        width: 100%;
        padding: 10px 0;
        border: none;
        outline: none;
        box-shadow: none;
      }
      button {
        overflow: hidden;
        padding: 0;
        line-height: 2.5;
        border: none;
        outline: 1px solid var(--border);
        outline-offset: -1px;
      }

      &:has(.add_button:focus),
      &:has(.add_button:not(:placeholder-shown)) {
        grid-template-rows: max-content 1fr;
      }
    }

    .items {
      .items_inner {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-height: 42px;
        // display: contents;
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
          box-sizing: border-box;
        }
      }

      &.templates {
        .items_inner:empty::before {
          content: "Deze categorie heeft geen templates";
        }
      }
    }

    .item {
      --padding: 13px 10px;
      display: flex;
      align-items: center;
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
        &:hover {
          background-color: #e0e0e0;
        }
      }
    }
  }
</style>
