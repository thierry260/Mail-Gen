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
  let allTemplates = [];
  let searchInput = "";
  let searchResults = [];

  $: {
    data = $templatesStore;

    if (data) {
      data = data.map((category) => ({
        ...category,
      }));
      allTemplates = extractTemplates($templatesStore);
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

  const extractTemplates = (store, templates = []) => {
    store.forEach((category) => {
      if (category.templates) {
        templates = templates.concat(category.templates);
      }
      if (category.sub) {
        category.sub.forEach((subcategory) => {
          templates = extractTemplates(subcategory, templates);
        });
      }
    });
    return templates;
  };
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

  {#if favoriteTemplates && favoriteTemplates.length}
    <div class="favorite_templates">
      <h2>Favoriete templates</h2>
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
    </div>
  {/if}

  {#if recentlyViewed && recentlyViewed.length}
    <div class="recently_viewed">
      <h2>Recent bekeken</h2>
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
    </div>
  {/if}

  {#if allTemplates && allTemplates.length}
    <div class="all_templates">
      <h2>Templates</h2>
      <div class="recent_templates">
        {#each allTemplates as template}
          <Thumbnail
            type={"template"}
            id={template.id}
            name={template.name}
            content={template.content}
          />
        {/each}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .home {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  .favorite_templates,
  .recently_viewed {
    ~ .all_templates {
      display: none;
    }
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
