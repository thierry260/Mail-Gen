<script>
  import { onMount } from "svelte";
  import { fetchWorkspaceData } from "$lib/utils/get";

  let data = [];
  let recentlyViewed = [];

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

    // Function to retrieve recently viewed templates from localStorage
    const getRecentlyViewed = () => {
      return JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    };

    // Retrieve recently viewed templates
    recentlyViewed = getRecentlyViewed();
  });
</script>

<div class="home">
  <h1>Waar ben je naar op zoek?</h1>
  <input type="text" placeholder="Zoek op templates" />

  <!-- Recently viewed templates section -->
  <div class="recently_viewed">
    <h2>Recent bekeken</h2>
    {#if recentlyViewed.length === 0}
      <p>Geen templates recent bekeken.</p>
    {:else}
      {#each recentlyViewed as template}
        <div class="recent_template">
          <h3>{template.name}</h3>
          <!-- <p>{template.description}</p> -->
        </div>
      {/each}
    {/if}
  </div>

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
  .home {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .recently_viewed {
    margin-top: 20px;
  }

  .recent_template {
    background-color: #f0f0f0;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 5px;
  }
</style>
