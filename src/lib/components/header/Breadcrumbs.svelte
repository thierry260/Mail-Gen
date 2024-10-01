<script>
  import { page } from "$app/stores";
  import { templatesStore } from "$lib/stores/templates";
  import { CaretLeft, Layout, GearSix } from "phosphor-svelte";

  let breadcrumbs = [];
  let fetchedData = [];
  export let type;

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
            if (!path.some((crumb) => crumb.id === subItem.id)) {
              path.unshift({
                name: subItem.name,
                type: "category",
                id: subItem.id,
              });
            }
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

  $: {
    fetchedData = Array.isArray($templatesStore) ? $templatesStore : [];
  }

  // Watch for changes in $page and update breadcrumbs accordingly
  $: {
    const currentId = $page.params?.id;
    const currentType =
      $page.route.id && $page.route.id.includes("template")
        ? "template"
        : "category";
    if (!currentId) {
      breadcrumbs = [{ name: "Dashboard", type: "dash", id: null }];

      // Add "Settings" breadcrumb if the URL contains 'settings'
      if ($page.route.id && $page.route.id.includes("settings")) {
        breadcrumbs = [{ name: "Instellingen", type: "settings", id: null }];
      }
    }
    if (currentId && currentType && fetchedData && fetchedData.length > 0) {
      breadcrumbs = generateBreadcrumbs(currentId, currentType, fetchedData);
    } else {
      console.warn("Current ID or type not available.", currentId, currentType);
    }
  }
</script>

<!-- Desktop Breadcrumbs -->
<nav aria-label="Breadcrumb">
  <ol class="breadcrumbs desktop-only">
    {#if breadcrumbs.length}
      {#each breadcrumbs as crumb, index (index)}
        <li>
          <a href={breadcrumbUrl(crumb)}>
            {#if crumb.type == "dash"}
              <div class="icon"><Layout size={18} /></div>
              {#if breadcrumbs.length == 1}
                Dashboard
              {/if}
            {:else if crumb.type == "settings"}
              <div class="icon"><GearSix size={18} /></div>
              {#if breadcrumbs.length == 1}
                Instellingen
              {/if}
            {:else}
              {crumb.name}
            {/if}
          </a>
        </li>
        {#if index !== breadcrumbs.length - 1}
          <span class="separator">/</span>
        {/if}
      {/each}
    {/if}
  </ol>
</nav>

<!-- Mobile Breadcrumb (visible on small screens) -->
<nav class="mobile-breadcrumb mobile-only">
  {#if breadcrumbs.length}
    <a
      href={breadcrumbs[breadcrumbs.length - 1].name == "Instellingen"
        ? "/your-custom-url" // Set your desired URL for "Instellingen"
        : breadcrumbUrl(
            breadcrumbs[breadcrumbs.length - 2] || {
              name: "Dashboard",
              type: "dash",
              id: null,
            }
          )}
    >
      {#if breadcrumbs[breadcrumbs.length - 1].name == "Dashboard"}
        <div class="icon"><Layout size={14} /></div>
      {:else if breadcrumbs[breadcrumbs.length - 1].name == "Instellingen"}
        <div class="icon"><GearSix size={14} /></div>
      {:else}
        <div class="icon"><CaretLeft size={14} /></div>
      {/if}
      <span>{breadcrumbs[breadcrumbs.length - 1].name}</span>
    </a>
  {:else}
    <a href="/dashboard">
      <!-- Fallback link or Dashboard URL -->
      <div class="icon"><Layout size={14} /></div>
      <span>Dashboard</span>
    </a>
  {/if}
</nav>

<style lang="scss">
  .breadcrumbs {
    display: flex;
    justify-content: flex-end;
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
      white-space: nowrap;

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

  .mobile-breadcrumb {
    display: none;
    .icon {
      display: flex;
    }
    a {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 1.4rem;
      color: var(--gray-800);
      text-decoration: none;

      span {
        display: block;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }

  // Media query for mobile devices
  @media (max-width: $lg) {
    .desktop-only {
      display: none;
    }
    .mobile-breadcrumb {
      display: block;
    }
  }
</style>
