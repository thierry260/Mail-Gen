<!-- src/lib/components/header/Breadcrumbs.svelte -->
<script>
  export let id; // Ontvang de id als prop
  import { onMount } from "svelte";
  import { fetchWorkspaceData } from "$lib/fetch/workspace";

  let breadcrumbs = [];
  let categories = [];

  $: if (id) {
    setBreadcrumbs(id);
  }

  onMount(async () => {
    categories = await fetchWorkspaceData("categories");
    setBreadcrumbs(id);
  });

  function setBreadcrumbs(id) {
    breadcrumbs = [];
    let category = categories.find((cat) => cat.id === id);

    while (category) {
      breadcrumbs.unshift(category);
      category = categories.find((cat) => cat.id === category.parentId); // Veronderstelt dat elke categorie een parentId heeft
    }
  }
</script>

<nav aria-label="breadcrumb">
  <ul class="breadcrumbs">
    {#each breadcrumbs as breadcrumb}
      <li class="breadcrumb-item">{breadcrumb.name}</li>
    {/each}
  </ul>
</nav>

<style>
  .breadcrumbs {
    display: flex;
    align-items: center;
    list-style: none;
    padding: 0;
  }

  .breadcrumb-item {
    margin-right: 5px;
  }

  .breadcrumb-item::after {
    content: ">";
    margin-left: 5px;
  }

  .breadcrumb-item:last-child::after {
    content: "";
  }
</style>
