<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { fetchWorkspaceData } from "$lib/utils/get";
  import { CaretRight } from "phosphor-svelte";

  let data = [];
  let searchInput = "";
  let searchValue = "";
  let searchResults = [];
  let focusedResultIndex = -1; // Index of the currently focused result

  export let location = "flat";

  let searchInputRef;

  onMount(async () => {
    data = await fetchWorkspaceData("categories");
    if (data) {
      data = data.map((category) => ({
        ...category,
        open: false,
      }));
    }

    // Add keydown event listener to the window
    window.addEventListener("keydown", handleKeyDown);
  });

  // Function to handle search input change
  const handleSearchInputChange = (event) => {
    searchInput = event.target.value.trim();
    if (searchInput) {
      searchResults = searchItems(data, searchInput);
      focusedResultIndex = -1; // Reset focused result when search changes
    } else {
      searchResults = [];
    }
  };

  const handleSearchInputblur = (event) => {
    // Delay hiding the results to check if focus moves to a search result
    setTimeout(() => {
      // Check if the new focus is still on a search result
      const activeElement = document.activeElement;
      if (!activeElement.classList.contains("search_result")) {
        searchResults = [];
        focusedResultIndex = -1; // Reset the focused index
      }
    }, 100);
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

  // Handle keydown events globally
  const handleKeyDown = (event) => {
    if (
      event.key === "/" &&
      event.target.tagName !== "INPUT" &&
      event.target.tagName !== "TEXTAREA"
    ) {
      event.preventDefault(); // Prevent default action (like typing `/` in the input)
      searchInputRef.focus();
      searchInputRef.click();
    }

    // Handle Enter key when the input is focused and there are search results
    if (event.key === "Enter" && document.activeElement === searchInputRef) {
      // Check if there are search results and focus on the first result
      if (searchResults.length > 0) {
        const firstResultElement = document.querySelector(`.search_result_0`);
        if (firstResultElement) {
          firstResultElement.click(); // Simulate a click on the first search result
        }
      }
    }

    // Handle Escape key to blur input or search result
    if (event.key === "Escape") {
      // If the active element is the input or a search result, blur it
      if (
        document.activeElement === searchInputRef || // If it's the input
        document.activeElement.classList.contains("search_result") // If it's a search result
      ) {
        document.activeElement.blur(); // Blur the currently focused element
        searchResults = []; // Hide the search results
        focusedResultIndex = -1; // Reset focused result
      }
    }

    // Handle arrow keys for navigating search results
    if (searchResults.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault(); // Prevent page scrolling

        // Move down in the list, or reset if at the end
        focusedResultIndex = (focusedResultIndex + 1) % searchResults.length;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault(); // Prevent page scrolling

        // If the user presses the up key on the first result, refocus the input
        if (focusedResultIndex === 0) {
          searchInputRef.focus();
          focusedResultIndex = -1; // Reset the focused result index
        } else {
          // Move up in the list, or loop back from the top
          focusedResultIndex =
            (focusedResultIndex - 1 + searchResults.length) %
            searchResults.length;
        }
      }

      // Focus the corresponding search result element if a result is selected
      if (
        focusedResultIndex >= 0 &&
        focusedResultIndex < searchResults.length
      ) {
        const resultElement = document.querySelector(
          `.search_result_${focusedResultIndex}`
        );
        if (resultElement) {
          resultElement.focus();
        }
      }
    }
  };
</script>

<div class="search {location}">
  <div class="search_input">
    <input
      type="text"
      placeholder="Zoeken"
      on:blur={handleSearchInputblur}
      on:input={handleSearchInputChange}
      on:click={handleSearchInputChange}
      bind:value={searchValue}
      bind:this={searchInputRef}
    />
    <div class="shortcut-bubble">/</div>
  </div>
  <!-- Display search results -->
  <div class="search_results" hidden={searchResults.length === 0}>
    {#each searchResults as result, i}
      <a
        href="#"
        class="search_result search_result_{i}"
        tabindex="-1"
        on:click={() => navigateTo(result.type, result.id)}
        class:focused={i === focusedResultIndex}
      >
        <div>
          <h3>{result.name}</h3>
          <span class="label"
            >{result.type == "category" ? "categorie" : result.type}</span
          >
        </div>
        <CaretRight size={14} />
      </a>
    {/each}
  </div>
</div>

<style lang="scss">
  .search {
    position: relative;

    .search_input {
      position: relative;
      input[type="text"] {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%234a4a4a' viewBox='0 0 256 256'%3E%3Cpath d='M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z'%3E%3C/path%3E%3C/svg%3E");
        background-position: left 12px center;
        background-repeat: no-repeat;
        background-size: 16px;
        padding-left: 35px;
        width: 100%;
      }

      .shortcut-bubble {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background-color: var(--gray-200);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 1.3rem;
        color: var(--gray-600);
      }
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
        padding: 10px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-decoration: none;
        gap: 10px;
        transition:
          background-color,
          0.2s ease-out;
        color: var(--gray-600);

        &:focus,
        &:focus-visible {
          // background-color: var(--gray-200);
          // color: var(--primary-darker);
          outline: none;
          .label {
            // background-color: hsl(from var(--primary) h s calc(l + 35));
          }
        }

        div {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-start;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          h3 {
            display: block;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            font-size: 1.4rem;
            font-weight: 500;
            margin-bottom: 0;
            flex-grow: 1;
            color: inherit;
          }

          .label {
            margin: 0;
            background-color: var(--gray-200);
            padding: 2px 6px;
            border-radius: 5px;
            font-weight: 400;
            text-transform: none;
            color: inherit;
            font-size: 1.1rem;
          }
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

    &.sidebar {
      z-index: 10;
      input[type="text"] {
        border-radius: var(--border-radius-big, 10px);
        border: none;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
        min-height: 44px;
        transition: outline-color 0.2s ease-out;
        outline-width: 100vw;
        outline-color: rgba(0, 0, 0, 0);
        outline-style: solid;
        &:focus {
          outline-color: rgba(0, 0, 0, 0.2);
        }
      }
      .search_results {
        border-radius: var(--border-radius-big, 10px);

        .search_result {
          outline: 100vw solid rgba(0, 0, 0, 0);
          &:focus,
          &:focus-visible {
            outline-color: rgba(0, 0, 0, 0.2);
          }
        }
      }
    }
  }
</style>
