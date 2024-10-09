<script>
  import Sortable from "sortablejs";
  import { onMount } from "svelte";
  import { DotsSixVertical, PencilSimple, TrashSimple } from "phosphor-svelte";

  export let categories = [];
  export let level = 0;
  export let onSelect;
  export let onMove;
  export let selectedCategories = []; // Receive selectedCategories as a prop
  export let onRename; // Function to handle renaming a category
  export let onRemove; // Function to handle removing a category

  let columnContent;

  // Initialize Sortable.js for drag-and-drop functionality
  onMount(() => {
    new Sortable(columnContent, {
      group: "categories",
      animation: 150,
      handle: ".drag",
      onEnd: (event) => {
        const item = categories[event.oldIndex];
        const toCategory = categories[event.newIndex];
        onMove(item, categories[event.oldIndex], toCategory);
      },
    });
  });

  // Rename category function
  const renameCategory = (event, category) => {
    const nameElement = event.target
      .closest(".category")
      .querySelector(".name");
    nameElement.setAttribute("contenteditable", "true");
    nameElement.focus();

    // Select all the text for the user
    document.execCommand("selectAll", false, null);

    // Handle blur event when renaming is finished
    nameElement.addEventListener(
      "blur",
      () => {
        const newName = nameElement.innerText.trim();
        nameElement.removeAttribute("contenteditable");
        if (newName && newName !== category.name) {
          onRename(category, newName); // Call the rename function
        }
      },
      { once: true }
    );
  };

  // Remove category function
  const removeCategory = (category) => {
    if (
      confirm(
        `Weet je zeker dat je categorie "${category.name}" en alle onderliggende templates en categorieën wilt verwijderen?`
      )
    ) {
      onRemove(category); // Call the remove function
    }
  };
</script>

<div class="column">
  <div class="content" bind:this={columnContent}>
    {#each categories as category (category.id)}
      <div
        class="category category-{category.id} {selectedCategories.includes(
          category
        )
          ? 'active'
          : ''}"
        on:click={() => onSelect(level, category)}
      >
        <span class="icon drag">
          <DotsSixVertical size={16} />
        </span>
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
      </div>
    {/each}
  </div>
  <input class="button simple add_cat" placeholder="+ Categorie toevoegen" />
</div>

<!-- <div class="column">
  <div class="content" bind:this={columnContent}>
    {#each categories as category (category.id)}
      <div
        class="category {selectedCategories.includes(category) ? 'active' : ''}"
        on:click={() => onSelect(level, category)}
      >
        <span class="icon drag">
          <DotsSixVertical size={16} />
        </span>
        <span class="name">{category.name}</span>
        <span class="actions">
          <span
            class="icon rename"
            on:click={(e) => {
              e.stopPropagation();
              renameCategory(e, category);
            }}
          >
            <PencilSimple size={14} />
          </span>
          <span
            class="icon remove"
            on:click={(e) => {
              e.stopPropagation();
              removeCategory(category);
            }}
          >
            <TrashSimple size={14} />
          </span>
        </span>
      </div>
    {/each}
  </div>
  <input class="button simple add_cat" placeholder="+ Categorie toevoegen" />
</div> -->

<style lang="scss">
  .column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 300px;

    .content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 42px;

      &:empty::before {
        content: "Deze categorie is leeg";
        --notice-hs: 214.29deg, 10%;
        --response-color: var(--notice-hs);
        background-color: hsl(var(--response-color), 98%);
        color: hsl(var(--response-color), 50%);
        border: 1px dashed hsl(var(--response-color), 75%);
        padding: 20px;
        border-radius: 5px;
        padding: 10px;
        text-align: center;
        font-size: 1.4rem;
        line-height: 1.5;
        /* min-height: 40px; */
        box-sizing: border-box;
      }
    }

    .category {
      --padding: 13px 10px;
      display: flex;
      align-items: center;
      // gap: 5px;
      cursor: pointer;
      padding: 0;
      background-color: #f0f0f0;
      border-radius: 5px;
      outline: 1px solid transparent;
      font-size: 1.4rem;
      outline-offset: -1px;
      user-select: none;
      transition:
        background-color 0.2s ease-out,
        border-color 0.2s ease-out,
        color 0.2s ease-out;

      &:hover {
        background-color: #e0e0e0;
      }

      &.active {
        outline-color: var(--primary);
        background-color: hsl(from var(--primary) h s calc(l + 25));
        color: hsl(from var(--primary) h s calc(l - 60));

        // color: #fff;
        // background-color: hsl(from var(--primary) h s calc(l - 60));
      }

      .icon {
        display: flex;
      }

      .drag {
        padding: var(--padding);
        padding-right: 5px;
        cursor: grab;
      }
      .name {
        flex-grow: 1;
        outline: none;
      }
      .actions {
        display: flex;
        align-items: center;
        // gap: 2px;

        padding: var(--padding);
        padding-block: 5px;
        padding-left: 5px;

        color: var(--gray-500);

        .icon {
          transition: color 0.2s ease-out;
          padding: 4px;
          &:hover {
            color: var(--gray-800);
          }
        }
      }
    }

    .add_cat.add_cat {
      cursor: unset;
      padding: 10px 0;
      border: none;
      outline: none;
      box-shadow: none;
    }
  }
</style>
