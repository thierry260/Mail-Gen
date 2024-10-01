<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { user } from "$lib/stores/user";
  import SidebarItem from "./SidebarItem.svelte";
  import {
    Layout,
    Gear,
    ArrowsInLineVertical,
    ArrowsOutLineVertical,
    SignOut,
    CaretLeft,
  } from "phosphor-svelte";
  import { getAuth, signOut } from "firebase/auth";
  import { goto } from "$app/navigation";
  import { fetchWorkspaceData } from "$lib/utils/get";
  import Search from "$lib/components/Search.svelte";
  import { createCategory } from "$lib/utils/create";
  import { templatesStore } from "$lib/stores/templates";
  import { getCategoriesAndCachedTemplates } from "$lib/utils/cache";
  import Sortable from "sortablejs";
  import { switchMobileNav } from "$lib/utils/utils.js";
  import { browser } from "$app/environment";

  $: currentUser = $user;

  let data = [];
  let currentId = "";
  let currentType;
  let isHomeActive = false;
  let isSettingsActive = false;
  let areAllOpen = false;
  let sortableInstance; // Reference to the Sortable instance
  let isCompact = false;

  $: {
    currentId = $page.params.id;
    currentType = $page.route.id.includes("template") ? "template" : "category";
    isHomeActive =
      $page.route.id === "" ||
      $page.route.id === "/" ||
      $page.route.id === "/(app)";
    isSettingsActive = $page.route.id.includes("/settings");
  }

  $: $templatesStore, console.log("templatesStore updated:", $templatesStore);

  onMount(async () => {
    checkSidebarState();

    let fetchedData = await fetchWorkspaceData("categories");
    console.log("categories: ", fetchedData);
    if (Array.isArray(fetchedData)) {
      data = fetchedData.map((category) => ({
        ...category,
        open: false, // Add open property to handle accordion state
      }));
      data.forEach((item) => expandParents(item, currentId, currentType));
      // templatesStore.set(data); // Initialize the store with the data
    } else {
      console.log("Categories not found");
      data = []; // Ensure data is an empty array if fetch fails
    }

    let categories = await getCategoriesAndCachedTemplates();
    console.log("cached categories: ", categories);
    if (Array.isArray(categories)) {
      data = categories.map((category) => ({
        ...category,
        open: false, // Add open property to handle accordion state
      }));
      console.log(data);
      data.forEach((item) => expandParents(item, currentId, currentType));
      templatesStore.set(data); // Initialize the store with the data
    } else {
      console.log("Categories not found");
      data = []; // Ensure data is an empty array if fetch fails
    }

    // // Select the main container that holds the top-level items
    // const el = document.querySelector(".templates_items");

    // if (el) {
    //   sortableInstance = new Sortable(el, {
    //     animation: 150, // Smooth animation
    //     handle: ".accordion_header", // Restrict dragging to the header
    //     group: {
    //       name: "nested",
    //       pull: true, // Allow items to be dragged out
    //       put: true, // Allow items to be dropped in
    //     },
    //     onEnd: (event) => {
    //       const oldIndex = event.oldIndex;
    //       const newIndex = event.newIndex;

    //       // Update the top-level `data` array order
    //       const movedItem = data.splice(oldIndex, 1)[0];
    //       data.splice(newIndex, 0, movedItem);

    //       console.log("New top-level data order:", data);

    //       // Update in your state or database if needed
    //     },
    //   });

    //   // Initialize Sortable for each nested accordion content
    //   const nestedElements = document.querySelectorAll(".accordion_content");

    //   nestedElements.forEach((nestedEl) => {
    //     new Sortable(nestedEl, {
    //       animation: 150, // Smooth animations
    //       group: {
    //         name: "nested", // Allows nested drag-and-drop
    //         pull: true,
    //         put: true,
    //       },
    //       handle: ".accordion_header", // Only drag when header is clicked
    //       onEnd: (event) => {
    //         const parentId = nestedEl.closest(".accordion_item").id; // Get the parent category ID
    //         const parentCategory = data.find((item) => item.id === parentId); // Find the correct parent in data
    //         const oldIndex = event.oldIndex;
    //         const newIndex = event.newIndex;

    //         if (parentCategory) {
    //           // Handle reordering inside subcategories or templates
    //           const movedItem = parentCategory.subcategories.splice(
    //             oldIndex,
    //             1
    //           )[0];
    //           parentCategory.subcategories.splice(newIndex, 0, movedItem);

    //           console.log(
    //             `New order for ${parentCategory.name}:`,
    //             parentCategory.subcategories
    //           );

    //           // Save this new order in the state or backend if needed
    //         }
    //       },
    //     });
    //   });
    // }

    // // Clean up when component unmounts
    // return () => {
    //   if (sortableInstance) {
    //     sortableInstance.destroy();
    //   }

    //   const nestedInstances = document.querySelectorAll(".accordion_content");
    //   nestedInstances.forEach((nestedEl) => {
    //     const instance = Sortable.get(nestedEl);
    //     if (instance) {
    //       instance.destroy();
    //     }
    //   });
    // };
  });

  const checkSidebarState = () => {
    if (!browser) return;
    const storedState = localStorage.getItem("sidebarState");
    if (storedState) {
      isCompact = storedState === "compact";
    }
  };

  // Toggle sidebar between wide and compact mode
  const toggleSidebar = () => {
    isCompact = !isCompact;
    localStorage.setItem("sidebarState", isCompact ? "compact" : "wide");
  };

  const expandParents = (item, currentId, currentType) => {
    if (currentType === "category" && item.id === currentId) {
      item.open = true;
      return true;
    }
    if (currentType === "template" && item.templates) {
      for (const template of item.templates) {
        if (template.id === currentId) {
          item.open = true;
          return true;
        }
      }
    }
    if (item.sub) {
      for (const subItem of item.sub) {
        if (expandParents(subItem, currentId, currentType)) {
          item.open = true;
          return true;
        }
      }
    }
    return false;
  };

  const toggleAll = () => {
    areAllOpen = !areAllOpen;
    data = data.map((category) => ({
      ...category,
      open: areAllOpen,
      sub: category.sub
        ? category.sub.map((sub) => ({ ...sub, open: areAllOpen }))
        : category.sub,
      templates: category.templates
        ? category.templates.map((template) => ({
            ...template,
            open: areAllOpen,
          }))
        : category.templates,
    }));
  };
  // Logout function
  const logout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);

      Object.keys(localStorage).forEach((key) => {
        if (key !== "favoriteTemplates" && key !== "recentlyViewed") {
          localStorage.removeItem(key);
        }
      });

      goto("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const addMainCat = async () => {
    try {
      const newCategoryName = prompt(
        "Geef een naam in voor de nieuwe categorie:"
      );

      if (newCategoryName && newCategoryName.trim() !== "") {
        const newCategory = await createCategory(false, newCategoryName.trim());

        if (newCategory) {
          console.log(`New category created successfully:`, newCategory);
          data = [...data, newCategory];
        } else {
          console.log("Failed to create the new category.");
        }
      } else {
        console.log("Category name cannot be empty.");
      }
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };
</script>

<div class="sidebar {isCompact ? 'compact' : 'wide'}">
  <div class="brand_outer">
    <a href="/" class="flex brand align-center gap-15 hide_mobile">
      <figure class="logo_outer" on:click={(e) => switchMobileNav("browse")}>
        <img class="logo" src="/img/MailGen-icon.svg" alt="MailGen logo" />
      </figure>
      <div class="hide_on_compact">
        <h6>Mail Gen</h6>
        <small>Early access</small>
      </div>
    </a>
    <span class="sidebar_toggle" on:click={toggleSidebar}>
      <div class="icon_outer"><CaretLeft size={14} /></div>
    </span>
  </div>
  <Search location={"sidebar"} />

  <div class="templates hide_on_compact">
    <span class="label">
      Templates
      <button class="toggle-all-icon" on:click={toggleAll}>
        {#if areAllOpen}
          <ArrowsInLineVertical size={15} />
        {:else}
          <ArrowsOutLineVertical size={15} />
        {/if}
      </button>
    </span>
    <div class="templates_items">
      {#if Array.isArray(data)}
        {#each data as item}
          <SidebarItem bind:item {currentId} {currentType} />
        {/each}
      {:else}
        <p>Loading...</p>
      {/if}
      <button class="menu_item add_main_cat" on:click={addMainCat}>
        + Hoofdcategorie toevoegen
      </button>
    </div>
  </div>
  <div class="sidebar-bottom hide_mobile">
    <div class="user">
      <figure class="avatar">
        <img width="35px" height="35px" src="/img/placeholder.jpg" />
      </figure>
      <div class="info hide_on_compact">
        <strong
          >{currentUser && currentUser.displayName
            ? currentUser.displayName
            : currentUser && currentUser.email
              ? currentUser.email
              : ""}
        </strong>
        <span>{localStorage.getItem("workspace")}</span>
      </div>
    </div>
    <a
      class="icon_button hide_on_compact"
      href="/settings"
      class:active={isSettingsActive}
      on:click={(e) => switchMobileNav("browse")}
    >
      <Gear size={16} />
    </a>
    <div class="icon_button hide_on_compact" on:click={logout}>
      <SignOut size={16} />
    </div>
  </div>
</div>

<style lang="scss">
  .sidebar {
    width: 360px;

    background: var(--primary-darkest);
    background: linear-gradient(
      230deg,
      hsl(from var(--primary) h s calc(l - 32)),
      hsl(from var(--primary) h s calc(l - 42))
    );
    color: #fff;
    // New styling
    background: #fff;
    color: var(--text);
    border-right: 1px solid var(--border);
    height: 100%;
    padding: 30px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 20px;
    position: relative;
    transition:
      width 0.3s ease-out,
      gap 0.3s ease-out,
      padding 0.3s ease-out;
    will-change: width;
    a {
      color: inherit;
      text-decoration: none;
    }
    .brand_outer {
      position: relative;
    }
    .brand {
      margin-bottom: 10px;

      .logo_outer {
        border-radius: var(--border-radius-big, 10px);
        background-color: var(--primary);
        background: linear-gradient(
          -45deg,
          hsl(from var(--primary) h s calc(l - 10)),
          hsl(from var(--primary) h s calc(l + 8))
        );
        background: var(--primary);
        width: max-content;
        padding: 12px;
        // box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

        .logo {
          max-width: 32px;
          aspect-ratio: 1;
          object-fit: contain;
          width: 100%;
          display: block;
          filter: brightness(0.1);
          opacity: 0.85;
        }
      }
      div {
        h6 {
          font-size: 1.9rem;
        }
        small {
          color: var(--gray-400);
          font-size: 1.3rem;
        }
      }
    }
    .templates {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      min-height: 1px;

      .label {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: default; /* Default cursor for the label */
        padding: 10px;
        min-height: 44px;
        background-color: transparent;
        border-radius: 10px;
        width: 100%;
        text-align: left;
        transition: background-color 0.1s ease-out;
        text-decoration: none;
        margin: 0;
        color: inherit;
        font-weight: 500;

        button {
          font-size: 0.5rem;
          cursor: default; /* Default cursor for the label */
          background-color: transparent;
          border: none; /* Remove border */
          text-align: left;
          transition: background-color 0.1s ease-out;
        }

        .toggle-all-icon {
          padding: 0;
          flex-shrink: 0;
          cursor: pointer; /* Pointer cursor for the icon */
          color: inherit;
        }
      }
      .templates_items {
        overflow-y: auto;
        padding-right: 15px;
        margin-right: -20px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: -20px;
        padding-bottom: 20px;

        mask-image: linear-gradient(
          180deg,
          rgba(0, 0, 0, 1),
          rgba(0, 0, 0, 1) 95%,
          rgba(0, 0, 0, 0) 100%
        );

        /* ===== Scrollbar CSS ===== */
        scrollbar-width: auto;
        // scrollbar-color: #ebebeb #ffffff;

        /* Chrome, Edge, and Safari */
        &::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.15);
          border-radius: 10px;
          border: px solid transparent;
        }
      }
    }

    .menu_item {
      cursor: pointer;
      padding: 10px;
      min-height: 44px;
      background-color: transparent;
      border: 1px solid transparent;
      border-radius: 10px;
      font-size: 1.4rem;
      width: 100%;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 5px;
      transition:
        border-color 0.1s ease-out,
        background-color 0.1s ease-out;
      color: inherit;
      text-decoration: none;

      .icon_outer {
        display: flex;
      }
      &.active {
        // background-color: hsl(from var(--primary) h s calc(l + 35));
        // background-color: rgba(255, 255, 255, 0.12);
        background-color: hsl(from var(--primary) h s calc(l + 16));
        // color: var(--primary);
        .icon_outer {
          /* svelte-ignore unused-selector */
          color: var(--primary);
        }
      }
      &:not(.active):hover {
        border-color: rgba(255, 2555, 255, 0.2);
      }
    }
    .add_main_cat {
      // border: 2px dashed rgba(255, 255, 255, 0.6);
      margin-top: 10px;
      color: rgba(255, 255, 255, 0.7);
      // text-align: center;
      // justify-content: center;
      // font-size: 1.4rem;
    }

    .sidebar-bottom {
      flex-shrink: 0;
      margin-top: auto;
      padding: 10px 15px;
      background-image: none;
      background-color: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      font-size: 1.6rem;
      transition:
        border-color 0.2s ease-out,
        padding 0.25s ease-out;
      overflow: hidden;
      gap: 10px;

      display: flex;
      justify-content: space-between;
      align-items: center;

      border: none;
      background-color: rgba(0, 0, 0, 0.075);

      border: 1px solid var(--border);
      background: #fff;

      padding: 12px 15px;

      .user {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-grow: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: 100%;

        figure {
          display: inline-flex;
          img {
            border-radius: 50%;
          }
        }
        .info {
          font-size: 1.3rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 1px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          max-width: 100%;
          * {
            line-height: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: flex-start;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          strong {
            font-weight: 300;
            font-family: $heading;
            font-size: 1.4rem;
          }
          span {
            opacity: 0.65;
          }
        }
      }
      .icon_button {
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.08);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 5px;
        cursor: pointer;
        transition: background-color 0.2s ease-out;

        &:hover {
          background-color: rgba(0, 0, 0, 0.12);
        }
        &.active {
          background: linear-gradient(
            -45deg,
            hsl(from var(--primary) h s calc(l - 10)),
            hsl(from var(--primary) h s calc(l + 8))
          );
          color: hsl(from var(--primary) h s calc(l - 70));
          // outline: 3px solid var(--primary);
          // outline-offset: -3px;
          pointer-events: none;
        }
      }
    }

    .sidebar_toggle {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      // bottom: 33px;
      top: 50%;
      right: -30px;
      transform: translate(100%, -50%);
      outline-color: transparent;
      border-radius: 0 20px 20px 0;
      aspect-ratio: 1;
      width: 30px;
      height: 32px;
      border: 1px solid var(--border);
      border-left: 0;
      background-color: #fff;
      cursor: pointer;
      user-select: none;
      z-index: 1;
      transition:
        transform 0.2s ease-out 0.1s,
        right 0.3s ease-out,
        background-color 0.3s ease-out;
      .icon_outer {
        transition: transform 0.25s ease-out;
        display: flex;
        color: var(--text);
      }

      &:hover {
        .icon_outer {
          transform: translateX(-2px);
        }
      }
    }

    .hide_on_compact {
      opacity: 1;
      transition:
        opacity 0.5s ease-out,
        width 0.3s ease-out,
        height 0.3s ease-out;
    }

    .brand {
      .hide_on_compact {
        overflow: hidden;
      }
    }

    @media (min-width: calc(#{$lg} + 1px)) {
      &.compact {
        width: 70px; // Adjust based on your design
        padding: 12px;
        gap: 15px;

        .brand {
          gap: 0;
          margin-bottom: 0;
          .logo {
            // max-width: unset;
          }
        }

        .hide_on_compact {
          overflow: hidden;
          opacity: 0;
          width: 0px;
          height: 0px;
        }
        .sidebar_toggle {
          right: -12px;
          .icon_outer {
            transform: rotate(180deg);
          }
          &:hover {
            .icon_outer {
              transform: rotate(180deg) translateX(-3px);
            }
          }
        }
        .sidebar-bottom {
          gap: 0;
          padding: 5px;
        }

        .user {
          overflow: unset;
        }
      }
    }

    @media (max-width: $lg) {
      &.sidebar {
        width: 100%;
        border-right: 0;

        .hide_mobile.hide_mobile {
          display: none;
        }
      }
    }
  }

  :global(.sidebar.compact .search) {
    input {
      background-position: left 14px center;
      padding-left: 25px;
      transition:
        min-width 0.2s ease-out,
        padding-left 0.2s ease-out,
        background-position 0.2s ease-out;

      &::placeholder {
        opacity: 0;
        transition: opacity 0.2s ease-out;
      }
    }

    &:has(input[type="text"]:focus),
    &:has(input[type="text"]:focus),
    &:has(.search_result:focus),
    &:has(.search_result:focus-visible) {
      input {
        background-position: left 12px center;
        padding-left: 35px;
      }

      &::placeholder {
        opacity: 1;
      }
    }
  }
</style>
