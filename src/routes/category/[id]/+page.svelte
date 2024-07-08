<!-- src/routes/category/[id]/+page.svelte -->
<script>
  import Breadcrumbs from "$lib/components/header/Breadcrumbs.svelte";
  import { page } from "$app/stores";
  import { fetchWorkspaceData } from "$lib/fetch/workspace";
  import { onDestroy } from "svelte";

  let id;
  let name;
  let categories = [];

  $: id = $page.params.id;

  const findCategoryById = (categories, id) => {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      } else if (category.sub) {
        const found = findCategoryById(category.sub, id);
        if (found) return found;
      }
    }
    return null;
  };

  const loadCategoryData = async () => {
    const data = await fetchWorkspaceData("categories");
    if (data) {
      categories = data.map((category) => ({
        ...category,
        open: false,
      }));

      const category = findCategoryById(categories, id);
      if (category) {
        name = category.name;
      } else {
        console.log("Category not found");
      }
    } else {
      console.log("Categories not found");
    }
  };

  // Load the category data on mount
  loadCategoryData();

  // Reactive statement to reload the category data whenever the ID changes
  $: {
    if (id) {
      loadCategoryData();
    }
  }
</script>

<div class="category">
  <h1>{name}</h1>
</div>
