<script>
  import { page } from "$app/stores";
  import { fetchWorkspaceData } from "$lib/utils/get";
  import { Layout } from "phosphor-svelte";

  let breadcrumbs = [];
  let fetchedData = [];

  // Function to generate breadcrumb URL based on type
  const breadcrumbUrl = (breadcrumb) => {
    switch (breadcrumb.type) {
      case "category":
        return `/category/${breadcrumb.id}`;
      case "template":
        return `/template/${breadcrumb.id}`;
      case "dash":
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
            // Add subcategory (subItem) only once
            if (!path.some((crumb) => crumb.id === subItem.id)) {
              path.unshift({
                name: subItem.name,
                type: "category",
                id: subItem.id,
              });
            }

            // Add parent category (item) only once
            if (!path.some((crumb) => crumb.id === item.id)) {
              path.unshift({ name: item.name, type: "category", id: item.id });
            }

            return true;
          }
        }
      }

      return false;
    };

    if (currentType === "dash") {
      path.push({ name: "Dashboard", type: "dash", id: null });
      return path;
    }

    data.forEach((category) => {
      if (findPath(category)) {
        path.unshift({ name: "Dashboard", type: "dash", id: null });
      }
    });

    return path;
  };

  // Fetch workspace data and update fetchedData
  const fetchData = async () => {
    try {
      const data = await fetchWorkspaceData("categories");
      fetchedData = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch workspace data:", error);
      fetchedData = [];
    }
  };

  // Call fetchData initially
  fetchData();

  // Watch for changes in $page and update breadcrumbs accordingly
  $: {
    const currentId = $page.params?.id;
    const currentType =
      $page.route.id && $page.route.id.includes("template")
        ? "template"
        : "category";
    if (!currentId) {
      breadcrumbs = [{ name: "Dashboard", type: "dash", id: null }];
    }
    if (currentId && currentType && fetchedData && fetchedData.length > 0) {
      breadcrumbs = generateBreadcrumbs(currentId, currentType, fetchedData);
    } else {
      console.warn("Current ID or type not available.", currentId, currentType);
    }
  }
</script>

<nav aria-label="Breadcrumb">
  <ol class="breadcrumbs">
    {#if breadcrumbs.length}
      {#each breadcrumbs as crumb, index (index)}
        <li>
          <a href={breadcrumbUrl(crumb)}>
            {#if crumb.type == "dash"}
              <div class="icon"><Layout size={18} /></div>
              {#if breadcrumbs.length == 1}
                Dashboard
              {/if}
            {:else}
              {crumb.name}
            {/if}
          </a>
        </li>
        {#if index !== breadcrumbs.length - 1}<span class="separator">/</span
          >{/if}
      {/each}
    {/if}
  </ol>
</nav>

<style lang="scss">
  .breadcrumbs {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 1.7rem;
    gap: 10px;
    color: var(--gray-400);

    li {
      display: inline-flex;
      align-items: center;
      gap: inherit;

      a {
        color: var(--blue); /* Customize link color */
        text-decoration: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: inherit;

        .icon {
          display: inline-flex;
        }

        &:hover {
          text-decoration: underline;
        }
      }

      &:last-child {
        a {
          color: var(--gray-800);
          pointer-events: none;
        }
      }
    }
    .separator {
      color: var(--gray-300); /* Customize arrow color */
    }
  }
</style>
