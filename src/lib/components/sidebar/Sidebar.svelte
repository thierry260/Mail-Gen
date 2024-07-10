<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { fetchWorkspaceData } from "$lib/fetch/workspace";
  import SidebarItem from "./SidebarItem.svelte";
  import { House } from "phosphor-svelte";
  import { get } from "svelte/store";

  let data = [];
  let currentId;
  let currentType;
  let isActive = false;

  $: {
    currentId = $page.params.id;
    currentType = $page.route.id.includes("template") ? "template" : "category";
    isActive = !(
      $page.route.id.includes("template") || $page.route.id.includes("category")
    );
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
</script>

<aside class="sidebar">
  <div>
    <a class="home" href="/" class:active={isActive}><House size={20} />Home</a>
    <span class="label">Templates</span>
    {#each data as item}
      <SidebarItem {item} {currentId} {currentType} />
    {/each}
  </div>
</aside>

<style lang="scss">
  .sidebar {
    width: 100%;
    max-width: 350px;
    background-color: var(--gray-100);
    height: 100%;
    padding: 20px;
    .home {
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
      color: var(--gray-600);
      text-decoration: none;
      margin-bottom: 20px;

      &.active {
        background-color: var(--gray-200); /* svelte-ignore unused-selector */
      }
      &:not(.active):hover {
        border-color: var(--gray-300);
      }
    }
  }
</style>
