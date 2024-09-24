<script>
  import { onMount } from "svelte";
  import { fetchWorkspaceData } from "$lib/utils/get";
  import { CaretRight, ArrowRight } from "phosphor-svelte";
  import Search from "$lib/components/Search.svelte";
  import Thumbnail from "$lib/components/Thumbnail.svelte";
  import Header from "$lib/components/header/Header.svelte";

  let data = [];
  let recentlyViewed = [];
  let favoriteTemplates = [];
  let searchInput = "";
  let searchResults = [];

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
          <Thumbnail
            type={"template"}
            id={template.id}
            name={template.name}
            content={template.content}
          />
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
          <Thumbnail
            type={"template"}
            id={template.id}
            name={template.name}
            content={template.content}
          />
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

  .categories_grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;

    .view_button {
      display: flex;
      align-items: center;
      gap: 5px;
      color: var(--text);
    }
    .category {
      background-color: #fff;
      padding: 20px;
      border-radius: var(--border-radius);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      cursor: pointer;
      text-decoration: none;
      transition:
        background-color 0.2s ease-out,
        border-color 0.2s ease-out;
      &:hover {
        // background-color: var(--gray-100);
        border-color: var(--gray-400);
      }
      &:active {
        color: inherit;
      }
      h3 {
        font-size: 1.8rem;
        flex-grow: 1;
      }
    }
  }

  .recent_templates {
    display: grid;
    flex-direction: column;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 480px), 1fr));
    gap: 20px;
  }
</style>
