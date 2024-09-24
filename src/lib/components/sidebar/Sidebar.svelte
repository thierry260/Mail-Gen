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
  } from "phosphor-svelte";
  import { getAuth, signOut } from "firebase/auth";
  import { goto } from "$app/navigation";
  import { fetchWorkspaceData } from "$lib/utils/get";
  import Search from "$lib/components/Search.svelte";
  import { createCategory } from "$lib/utils/create";
  import { templatesStore } from "$lib/stores/templates";
  import { getCategoriesAndCachedTemplates } from "$lib/utils/cache";

  $: currentUser = $user;

  let data = [];
  let currentId = "";
  let currentType;
  let isHomeActive = false;
  let isSettingsActive = false;
  let areAllOpen = false;

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
  onMount(async () => {
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
  });
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
      localStorage.clear();
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

<div class="sidebar">
  <a href="/" class="flex brand align-center gap-15 hide_mobile">
    <figure class="logo_outer">
      <img class="logo" src="/img/MailGen-icon.svg" alt="MailGen logo" />
    </figure>
    <div>
      <h6>Mail Gen</h6>
      <small>Early access</small>
    </div>
  </a>
  <Search location={"sidebar"} />
  <!-- <a class="menu_item" href="/" class:active={isHomeActive}>
    <div class="icon_outer"><Layout size={20} /></div>
    Dashboard
  </a> -->
  <div class="templates">
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
      <div class="info">
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
    <a class="icon_button" href="/settings" class:active={isSettingsActive}>
      <Gear size={16} />
    </a>
    <div class="icon_button" on:click={logout}>
      <SignOut size={16} />
    </div>
  </div>
</div>

<style lang="scss">
  .sidebar {
    width: 100%;
    max-width: 360px;

    background: var(--primary-darkest);
    background: linear-gradient(
      230deg,
      hsl(from var(--primary) h s calc(l - 32)),
      hsl(from var(--primary) h s calc(l - 44))
    );
    border-right: 1px solid var(--border);
    height: 100%;
    padding: 30px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #fff;
    gap: 20px;
    a {
      color: inherit;
      text-decoration: none;
    }
    .brand {
      margin-bottom: 10px;

      .logo_outer {
        border-radius: var(--border-radius-big, 10px);
        background-color: var(--primary);
        background: linear-gradient(
          -45deg,
          hsl(from var(--primary) h s calc(l - 8)),
          hsl(from var(--primary) h s calc(l + 8))
        );
        width: max-content;
        padding: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

        .logo {
          max-width: 32px;
          aspect-ratio: 1;
          object-fit: contain;
          width: 100%;
          display: block;
        }
      }
      div {
        h6 {
          font-size: 1.9rem;
        }
        small {
          color: var(--gray-300);
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
      font-size: 1.5rem;
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
        background-color: hsl(from var(--primary) h s calc(l + 35));
        background-color: rgba(255, 255, 255, 0.12);
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
      color: #fff;
      transition:
        border-color 0.2s ease-out,
        padding 0.25s ease-out;
      overflow: hidden;
      gap: 10px;

      display: flex;
      justify-content: space-between;
      align-items: center;

      border: none;
      background-color: rgba(0, 0, 0, 0.1);
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
        background-color: rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 5px;
        cursor: pointer;
        transition: background-color 0.2s ease-out;

        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        &.active {
          color: var(--primary);
          pointer-events: none;
        }
      }
    }

    @media (max-width: $lg) {
      max-width: unset;
      border-right: 0;

      .hide_mobile.hide_mobile {
        display: none;
      }
    }
  }
</style>
