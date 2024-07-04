<!-- SidebarItem.svelte -->

<script>
  export let item;
  import { goto } from "$app/navigation";
  import { CaretRight } from "phosphor-svelte";

  const viewTemplate = (templateId) => {
    goto(`/template/${templateId}`); // Navigate to the template details page
  };
</script>

<div class="accordion-item">
  <div
    class="accordion-header"
    on:click={() => (item.open = !item.open)}
    class:open={item.open}
  >
    <CaretRight size={16} class="dropdown" />{item.name}
  </div>
  {#if item.open}
    {#if item.templates}
      <div class="accordion-templates">
        {#each item.templates as template}
          <div class="template" on:click={() => viewTemplate(template.id)}>
            {template.name}
          </div>
        {/each}
      </div>
    {/if}
    {#if item.sub}
      <div class="accordion-content">
        {#each item.sub as subItem}
          <svelte:self item={subItem} />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .accordion-item {
    margin-left: 20px;
  }
  .accordion-header {
    cursor: pointer;
    padding: 10px 5px;
    background-color: #eee;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1.6rem;
    width: 100%;
    text-align: left;
  }
  .accordion-header .dropdown {
    transition: transform 0.2s ease-out;
  }
  .accordion-header.open .dropdown {
    transform: rotate(90deg);
  }

  .template {
    font-size: 1.6rem;
    padding: 10px 0;
  }

  .accordion-content {
    margin-left: 10px;
    border-left: 2px solid #ccc;
    /* padding-left: 10px; */
  }
</style>
