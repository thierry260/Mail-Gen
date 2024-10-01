<script>
  import { onMount } from "svelte";
  import { CaretRight, ArrowRight } from "phosphor-svelte";
  import { templatesStore } from "$lib/stores/templates";
  import Search from "$lib/components/Search.svelte";
  import Thumbnail from "$lib/components/Thumbnail.svelte";
  import Header from "$lib/components/header/Header.svelte";

  let data = [];
  let recentlyViewed = [];
  let favoriteTemplates = [];
  let searchInput = "";
  let searchResults = [];

  $: {
    data = $templatesStore;

    if (data) {
      data = data.map((category) => ({
        ...category,
        open: false, // Add open property to handle accordion state
      }));
      console.log(data);
    } else {
      console.log("Categories not found");
    }
  }

  onMount(async () => {
    // Function to retrieve recently viewed templates from localStorage
    const getRecentlyViewed = () => {
      return JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    };

    // Function to retrieve favorite templates from localStorage
    const getFavoriteTemplates = () => {
      return JSON.parse(localStorage.getItem("favoriteTemplates")) || [];
    };

    // Retrieve recently viewed and favorite templates
    recentlyViewed = getRecentlyViewed();
    favoriteTemplates = getFavoriteTemplates();
  });
</script>

<Header />
<div class="home">
  <!-- <div class="search">
    <Search />
  </div> -->

  <div class="categories">
    <h2>Categorieën</h2>
    <div class="categories_grid">
      {#each data as item}
        <Thumbnail type={"category"} id={item.id} name={item.name} />
      {/each}
    </div>
  </div>

  <div class="favorite_templates">
    <h2>Favoriete templates</h2>
    {#if favoriteTemplates.length === 0}
      <p class="empty">Je hebt nog geen favoriete templates</p>
    {:else}
      <div class="recent_templates">
        {#each favoriteTemplates as template}
          {#if JSON.stringify($templatesStore).includes(template.id)}
            <Thumbnail
              type={"template"}
              id={template.id}
              name={template.name}
              content={template}
            />
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <div class="recently_viewed">
    <h2>Recent bekeken</h2>
    {#if recentlyViewed.length === 0}
      <p class="empty">Je hebt geen recent bekeken templates</p>
    {:else}
      <div class="recent_templates">
        {#each recentlyViewed as template}
          {#if JSON.stringify($templatesStore).includes(template.id)}
            <Thumbnail
              type={"template"}
              id={template.id}
              name={template.name}
              content={template}
            />
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .home {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  .recent_templates {
    display: grid;
    flex-direction: column;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 480px), 1fr));
    gap: 20px;

    @media (max-width: $xs) {
      gap: 15px;
    }
  }
</style>
