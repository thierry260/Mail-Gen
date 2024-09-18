<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { fetchWorkspaceData } from "$lib/utils/get";
  import { CaretRight } from "phosphor-svelte";

  let data = [];
  let searchInput = "";
  let searchValue = "";
  let searchResults = [];

  onMount(async () => {
    data = await fetchWorkspaceData("categories");
    if (data) {
      data = data.map((category) => ({
        ...category,
        open: false, // Add open property to handle accordion state
      }));
      console.log(data);
    }
  });

  // Function to handle search input change
  const handleSearchInputChange = (event) => {
    searchInput = event.target.value.trim();
    if (searchInput) {
      searchResults = searchItems(data, searchInput);
    } else {
      searchResults = [];
    }
  };

  const handleSearchInputblur = (event) => {
    searchResults = [];
  };

  // Recursive function to search through categories and templates
  const searchItems = (items, query) => {
    let results = [];
    items.forEach((item) => {
      // Check if the item matches the query
      if (item.name.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          type: "category",
          id: item.id,
          name: item.name,
        });
      }

      // Check subcategories recursively
      if (item.sub) {
        results = results.concat(searchItems(item.sub, query));
      }

      // Check templates
      if (item.templates) {
        item.templates.forEach((template) => {
          if (template.name.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              type: "template",
              id: template.id,
              name: template.name,
            });
          }
        });
      }
    });
    return results.slice(0, 6); // Limit to maximum 6 results
  };

  // Function to navigate based on suggestion type
  const navigateTo = (type, id) => {
    // Clear search results to hide the dropdown
    searchResults = [];
    searchValue = "";

    if (type === "template") {
      goto(`/template/${id}`);
    } else if (type === "category") {
      goto(`/category/${id}`);
    }
  };
</script>

<div class="search">
  <input
    type="text"
    placeholder="Zoeken"
    on:blur={handleSearchInputblur}
    on:input={handleSearchInputChange}
    on:click={handleSearchInputChange}
    bind:value={searchValue}
  />
  <!-- Display search results -->
  <div class="search_results" hidden={searchResults.length === 0}>
    {#each searchResults as result}
      <a
        href="#"
        class="search_result"
        on:click={() => navigateTo(result.type, result.id)}
      >
        <h3>{result.name}</h3>
        <CaretRight size={18} />
      </a>
    {/each}
  </div>
</div>

<style lang="scss">
  .search {
    position: relative;
    input[type="text"] {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23a8a8a8' viewBox='0 0 256 256'%3E%3Cpath d='M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z'%3E%3C/path%3E%3C/svg%3E");
      background-position: left 12px center;
      background-repeat: no-repeat;
      background-size: 16px;
      padding-left: 35px;
      width: 100%;
    }
    .search_results {
      position: absolute;
      background-color: #fff;
      width: 100%;
      border: 1px solid var(--border);
      border-radius: var(--border-radius-small, 5px);
      transform: translateY(10px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1);
      .search_result {
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-decoration: none;
        transition:
          background-color,
          0.2s ease-out;
        h3 {
          font-size: 1.6rem;
          font-weight: 500;
          margin-bottom: 0;
        }

        &:hover {
          background-color: var(--gray-100);
        }
        &:not(:last-child) {
          border-bottom: 1px solid var(--border);
        }

        &:first-child {
          border-top-left-radius: inherit;
          border-top-right-radius: inherit;
        }
        &:last-child {
          border-bottom-left-radius: inherit;
          border-bottom-right-radius: inherit;
        }
      }
    }
  }
</style>
