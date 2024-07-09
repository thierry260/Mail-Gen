<!-- src/lib/components/sidebar/Sidebar.svelte -->
<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { fetchWorkspaceData } from "$lib/fetch/workspace";
  import SidebarItem from "./SidebarItem.svelte";

  let data = [];
  let currentId;
  let currentType;

  $: {
    currentId = $page.params.id;
    currentType = $page.route.id.includes("template") ? "template" : "category";
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
  }
</style>
