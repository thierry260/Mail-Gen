<!-- src/lib/components/Sidebar/Sidebar.svelte -->
<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { fetchWorkspaceData } from "$lib/utils/get";
  import { removeCategoryFromData } from "$lib/utils/delete";
  import SidebarItem from "./SidebarItem.svelte";
  import { House, Gear } from "phosphor-svelte";
  import { get } from "svelte/store";
  import { getAuth, signOut } from "firebase/auth";
  import { goto } from "$app/navigation";

  let data = [];
  let currentId;
  let currentType;
  let isHomeActive = false;
  let isSettingsActive = false;

  $: {
    currentId = $page.params.id;
    currentType = $page.route.id.includes("template") ? "template" : "category";
    isHomeActive =
      $page.route.id === "" ||
      $page.route.id === "/" ||
      $page.route.id === "/(app)";
    isSettingsActive = $page.route.id.includes("/settings");
  }

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
    data = await fetchWorkspaceData("categories");
    if (data) {
      data = data.map((category) => ({
        ...category,
        open: false, // Add open property to handle accordion state
      }));
      data.forEach((item) => expandParents(item, currentId, currentType));
      console.log(data);
    } else {
      console.log("Categories not found");
    }
  });

  // Handle category deletion event
  const handleCategoryDeleted = (event) => {
    console.log("handleCategoryDeleted triggered");
    const deletedCategoryId = event.detail;
    data = removeCategoryFromData(data, deletedCategoryId); // Update data array
  };
  // Logout function
  const logout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      goto("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };
</script>

<aside class="sidebar">
  <img class="logo" src="/img/MailGen-logo.svg" alt="MailGen logo" />
  <a class="menu_item" href="/" class:active={isHomeActive}
    ><House size={20} />Home</a
  >
  <div class="templates" on:category-deleted={handleCategoryDeleted}>
    <span class="label">Templates</span>
    {#each data as item}
      <SidebarItem {item} {currentId} {currentType} />
    {/each}
  </div>

  <a class="menu_item" href="/settings" class:active={isSettingsActive}
    ><Gear size={20} />Instellingen</a
  >
  <button class="logout-button" on:click={logout}>Uitloggen</button>
</aside>

<style lang="scss">
  .sidebar {
    width: 100%;
    max-width: 350px;
    background: linear-gradient(230deg, var(--primary), var(--secondary));
    height: 100%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .logo {
      max-width: 200px;
      margin-inline: auto;
      width: 100%;
      display: block;
      padding-block: 50px;
    }
    .label {
      color: #fff;
    }

    .templates {
      flex-grow: 1;
    }
    .menu_item {
      cursor: pointer;
      padding: 10px;
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
      color: #fff;
      text-decoration: none;
      margin-bottom: 20px;

      &.active {
        background-color: rgba(
          0,
          0,
          0,
          0.2
        ); /* svelte-ignore unused-selector */
      }
      &:not(.active):hover {
        border-color: rgba(255, 255, 255, 0.6);
      }
    }
    .logout-button {
      margin-top: auto;
      padding: 10px;
      background-color: transparent;
      border: 1px solid #ffffff77;
      border-radius: 10px;
      font-size: 1.6rem;
      color: #fff;
      cursor: pointer;
      transition: background-color 0.1s ease-out;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }
</style>
