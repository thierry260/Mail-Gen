<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { templatesStore } from "$lib/stores/templates";
  import { CaretRight } from "phosphor-svelte";

  let data = [];
  let searchInput = "";
  let searchValue = "";
  let searchBubbleText = "/";
  let searchResults = [];
  let lastClickedResults = []; // Store last clicked results
  let focusedResultIndex = -1; // Index of the currently focused result

  export let location = "flat";

  let searchInputRef = false;
  $: data = $templatesStore;

  onMount(async () => {
    if (data) {
      data = data.map((category) => ({
        ...category,
        open: false,
      }));
    }

    // Load last clicked results from localStorage
    const savedResults = localStorage.getItem("lastClickedResults");
    if (savedResults) {
      lastClickedResults = JSON.parse(savedResults);
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
      searchResults = []; // Clear search results if input is empty
    }
  };

  const handleSearchInputBlur = (event) => {
    // Delay hiding the results to check if focus moves to a search result
    setTimeout(() => {
      // Check if the new focus is still on a search result
      const activeElement = document.activeElement;
      if (!activeElement.classList.contains("search_result")) {
        searchResults = [];
        searchBubbleText = "/";
        focusedResultIndex = -1; // Reset the focused index
      }
    }, 100);
  };

  const searchItems = (items, query) => {
    let results = [];
    const lowerCaseQuery = query.toLowerCase();

    items.forEach((item) => {
      // Check if the category name includes the search query
      if (item.name.toLowerCase().includes(lowerCaseQuery)) {
        results.push({
          type: "category",
          id: item.id,
          name: item.name,
        });
      }

      // Recursively search in subcategories
      if (item.sub) {
        results = results.concat(searchItems(item.sub, query));
      }

      // Search within templates
      if (item.templates) {
        item.templates.forEach((template) => {
          const contentString = JSON.stringify(
            template.content || "",
          ).toLowerCase();

          // Check if template name or content contains the search query
          if (
            template.name.toLowerCase().includes(lowerCaseQuery) ||
            contentString.includes(lowerCaseQuery)
          ) {
            results.push({
              type: "template",
              id: template.id,
              name: template.name,
              matchedContent: contentString.includes(lowerCaseQuery)
                ? "Matched in content"
                : "",
            });
          }
        });
      }
    });

    return results.slice(0, 6); // Return the top 6 results for simplicity
  };

  /*************  ✨ Codeium Command 🌟  *************/
  // Helper function to search in the content array
  const searchInContent = (contentArray, query) => {
    let matches = [];

    const searchRecursively = (array) => {
      array.forEach((item) => {
        if (Array.isArray(item)) {
          // If item is an array, search recursively
          searchRecursively(item);
        } else if (typeof item === "object" && item) {
          // Search in both title and content
          if (
            item.title?.toLowerCase().includes(query) ||
            item.content?.toLowerCase().includes(query)
          ) {
            matches.push(item);
          }
        } else if (
          typeof item === "string" &&
          item.toLowerCase().includes(query)
        ) {
          matches.push(item);
        }
      });
    };

    searchRecursively(contentArray);
    return matches; // Return found matches
  };
  /******  6870f745-6e96-4d32-ac9c-37bc28b9521c  *******/

  // Function to navigate based on suggestion type
  const navigateTo = (type, id, name) => {
    // Clear search results to hide the dropdown
    searchResults = [];
    searchValue = "";
    searchBubbleText = "/";

    // Add to last clicked results if not already there
    const resultClicked = { type, id, name }; // Save name as well
    if (
      !lastClickedResults.some(
        (result) => result.type === type && result.id === id,
      )
    ) {
      lastClickedResults.unshift(resultClicked); // Add to the start of the array
      if (lastClickedResults.length > 5) {
        lastClickedResults.pop(); // Remove the last item if there are more than 5
      }
      localStorage.setItem(
        "lastClickedResults",
        JSON.stringify(lastClickedResults),
      ); // Save to localStorage
    }

    if (type === "template") {
      goto(`/template/${id}`);
    } else if (type === "category") {
      goto(`/category/${id}`);
    }
  };

  // Update the on:focus event to handle the shortcut bubble text
  const handleInputFocus = () => {
    searchBubbleText = "Esc"; // Change bubble text to Esc
    if (!searchValue) {
      // Show last clicked results if input is focused and empty
      searchResults = lastClickedResults;
    }
  };

  // Handle keydown events globally
  const handleKeyDown = (event) => {
    if (
      event.key === "/" &&
      event.target.tagName !== "INPUT" &&
      event.target.tagName !== "TEXTAREA" &&
      !event.target.classList.contains("tiptap")
    ) {
      event.preventDefault(); // Prevent default action (like typing `/` in the input)
      if (searchInputRef) {
        searchInputRef.focus();
        searchInputRef.click();
      }
      focusedResultIndex = -1; // Reset focused index on input open
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
        searchValue = "";
        searchResults = []; // Hide the search results
        searchBubbleText = "/";
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
          `.search_result_${focusedResultIndex}`,
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
      name="search"
      placeholder="Zoeken"
      bind:this={searchInputRef}
      on:blur={handleSearchInputBlur}
      on:input={handleSearchInputChange}
      on:focus={handleInputFocus}
      bind:value={searchValue}
      autocomplete="new-search"
    />
    <div class="shortcut-bubble">{searchBubbleText}</div>
  </div>
  <!-- Display search results -->
  <div class="search_results" hidden={searchResults.length === 0}>
    {#each searchResults as result, i}
      <a
        href="#"
        class="search_result search_result_{i}"
        tabindex="-1"
        on:click={() => navigateTo(result.type, result.id, result.name)}
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
        pointer-events: none;

        @media (max-width: $lg) {
          display: none;
        }
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
      // width: min-content;
      input[type="text"] {
        border-radius: var(--border-radius-big, 10px);
        border: none;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
        box-shadow: 0 0px 0px 2px rgba(0, 0, 0, 0.09);
        min-height: 44px;
        transition: outline-color 0.2s ease-out;
        outline-width: 200vmax;
        outline-color: rgba(0, 0, 0, 0);
        outline-style: solid;
        transition: min-width 0.2s ease-out;
        min-width: 0px;
        width: 100%;
        &:focus {
          outline-color: rgba(0, 0, 0, 0.2);
          min-width: 300px;
        }
      }
      .search_results {
        border-radius: var(--border-radius-big, 10px);

        .search_result {
          outline: 200vmax solid rgba(0, 0, 0, 0);
          &:focus,
          &:focus-visible {
            outline-color: rgba(0, 0, 0, 0.2);
            min-width: 298px;
            border-color: transparent;
          }
        }
      }
      &:has(input[type="text"]:focus),
      &:has(input[type="text"]:focus),
      &:has(.search_result:focus),
      &:has(.search_result:focus-visible) {
        min-width: 300px;
      }
    }
  }
</style>
