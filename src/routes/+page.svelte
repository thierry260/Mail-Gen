<script>
  import { onMount } from "svelte";
  import { fetchWorkspaceData } from "$lib/fetch/workspace";

  let data = [];

  onMount(async () => {
    data = await fetchWorkspaceData("categories");
    if (data) {
      data = data.map((category) => ({
        ...category,
        open: false, // Add open property to handle accordion state
      }));
      console.log(data);
    } else {
      console.log("Categories not found");
    }
  });
</script>

<div>
  <h1>Waar ben je naar op zoek?</h1>
  <input type="text" />
  <div class="recently_viewed"></div>
  <div class="recently_added"></div>
  <div class="categories">
    <h2>Categorieën</h2>
    {#each data as item}
      <div class="category">
        {item.name}
      </div>
    {/each}
  </div>
</div>

<style>
  h1 {
    font-family: sans-serif;
  }
  div {
    font-family: Arial, sans-serif;
  }
</style>
