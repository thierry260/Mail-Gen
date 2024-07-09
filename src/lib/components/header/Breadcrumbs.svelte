<script>
  import { onMount } from "svelte";
  import { derived } from "svelte/store";
  import { page } from "$app/stores";
  import { fetchWorkspaceData } from "$lib/fetch/workspace";

  let breadcrumbs = [];

  // Function to generate breadcrumb URL based on type
  const breadcrumbUrl = (breadcrumb) => {
    switch (breadcrumb.type) {
      case "category":
        return `/category/${breadcrumb.id}`;
      case "template":
        return `/template/${breadcrumb.id}`;
      case "home":
        return "/";
      default:
        return "#";
    }
  };

  // Function to generate breadcrumbs based on current route parameters
  const generateBreadcrumbs = (currentId, currentType, data) => {
    let path = [];

    const findPath = (item) => {
      if (currentType === "category" && item.id === currentId) {
        path.push({ name: item.name, type: "category", id: item.id });
        return true;
      }

      if (currentType === "template" && item.templates) {
        for (const template of item.templates) {
          if (template.id === currentId) {
            path.push({
              name: template.name,
              type: "template",
              id: template.id,
            });
            return true;
          }
        }
      }

      if (item.sub) {
        for (const subItem of item.sub) {
          if (findPath(subItem)) {
            path.unshift({ name: item.name, type: "category", id: item.id }); // Prepend parent category/template name
            return true;
          }
        }
      }

      return false;
    };

    // Clear breadcrumbs array if 'Home' breadcrumb is clicked
    if (currentType === "home") {
      path.push({ name: "Home", type: "home", id: null });
      return path;
    }

    data.forEach((category) => {
      if (findPath(category)) {
        path.unshift({ name: "Home", type: "home", id: null }); // Add 'Home' as the root of breadcrumbs
      }
    });

    return path;
  };

  // Derive workspace data based on the page store
  const data = derived(page, async ($page, set) => {
    try {
      const fetchedData = await fetchWorkspaceData("categories");
      set(fetchedData);
    } catch (error) {
      console.error("Failed to fetch workspace data:", error);
    }
  });

  onMount(() => {
    let unsubscribe;

    const loadBreadcrumbs = async () => {
      const currentId = $page.params.id;
      const currentType = $page.route.id.includes("template")
        ? "template"
        : "category";

      if (currentId && currentType) {
        const fetchedData = await fetchWorkspaceData("categories");
        breadcrumbs = generateBreadcrumbs(currentId, currentType, fetchedData);
      } else {
        console.warn("Current ID or type not available.");
      }
    };

    unsubscribe = data.subscribe(() => {
      loadBreadcrumbs();
    });

    loadBreadcrumbs(); // Initial load

    return () => {
      unsubscribe();
    };
  });

  // Subscribe to changes in the page store to update breadcrumbs
  $: {
    const currentId = $page.params.id;
    const currentType = $page.route.id.includes("template")
      ? "template"
      : "category";

    if (currentId && currentType) {
      const fetchedData = $data; // Use derived data directly
      breadcrumbs = generateBreadcrumbs(currentId, currentType, fetchedData);
    }
  }
</script>

<nav aria-label="Breadcrumb">
  <ol class="breadcrumbs">
    {#each breadcrumbs as crumb, index (index)}
      <li>
        <a href={breadcrumbUrl(crumb)}>{crumb.name}</a>
        {#if index !== breadcrumbs.length - 1}<span>&nbsp;&gt;&nbsp;</span>{/if}
      </li>
    {/each}
  </ol>
</nav>

<style lang="scss">
  .breadcrumbs {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 10px 0;
    font-size: 1.2rem;

    li {
      display: inline-flex;
      align-items: center;

      a {
        color: var(--blue); /* Customize link color */
        text-decoration: none;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }

      span {
        color: var(--gray-600); /* Customize arrow color */
      }
    }
  }
</style>
