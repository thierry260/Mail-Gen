<script>
  import Template from "./Template.svelte";
  import { templatesStore } from "$lib/stores/templates";
  export let category;
  export let level;
  export let selectCategory;
  export let moveItem;

  let isOpen = category.open || false;

  const toggleOpen = () => {
    isOpen = !isOpen;
    category.open = isOpen;
    templatesStore.update((cats) => [...cats]); // Trigger store update
  };

  const addSubcategory = (name) => {
    const newSubcategory = { id: Date.now(), name, sub: [], templates: [] };
    category.sub = [...category.sub, newSubcategory];
    templatesStore.update((cats) => [...cats]);
  };

  const addTemplate = (name) => {
    const newTemplate = { id: Date.now(), name };
    category.templates = [...category.templates, newTemplate];
    templatesStore.update((cats) => [...cats]);
  };

  const renameCategory = (newName) => {
    category.name = newName;
    templatesStore.update((cats) => [...cats]);
  };

  const deleteCategory = () => {
    if (confirm(`Are you sure you want to delete ${category.name}?`)) {
      templatesStore.update((cats) => {
        const removeCategory = (categories) => {
          return categories.filter((cat) => {
            if (cat.id === category.id) {
              return false;
            }
            if (cat.sub) {
              cat.sub = removeCategory(cat.sub);
            }
            return true;
          });
        };
        return removeCategory(cats);
      });
    }
  };
</script>

<div class="category" on:click={() => selectCategory(level, category)}>
  <div class="category-header">
    <div>
      <button on:click={toggleOpen}>{isOpen ? "▼" : "▶"}</button>
      <span>{category.name}</span>
    </div>
    <button on:click={deleteCategory}>Delete</button>
    <button
      on:click={() => renameCategory(prompt("Rename Category", category.name))}
      >Rename</button
    >
  </div>
  {#if isOpen}
    <div class="subcategories">
      {#if category.sub && category.sub.length > 0}
        {#each category.sub as subcategory}
          <svelte:self
            bind:category={subcategory}
            level={level + 1}
            {selectCategory}
            {moveItem}
          />
        {/each}
      {/if}
      {#if category.templates && category.templates.length > 0}
        {#each category.templates as template}
          <Template {template} />
        {/each}
      {/if}
      <button on:click={() => addSubcategory(prompt("Subcategory Name"))}
        >Add Subcategory</button
      >
      <button on:click={() => addTemplate(prompt("Template Name"))}
        >Add Template</button
      >
    </div>
  {/if}
</div>
