<!-- src/lib/components/sidebar/Sidebar.svelte -->
<script>
  import { onMount } from "svelte";
  import { fetchWorkspaceData } from "$lib/fetch/workspace";
  import SidebarItem from "./SidebarItem.svelte";

  let data = [];

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
  });
</script>

<aside class="sidebar">
  <div>
    <span class="label">Templates</span>
    {#each data as item}
      <SidebarItem {item} />
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
