<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { CaretRight, Plus } from "phosphor-svelte";
  import { createCategory, createNewTemplate } from "$lib/utils/create";
  import { templatesStore } from "$lib/stores/templates";
  import Thumbnail from "$lib/components/Thumbnail.svelte";
  import Header from "$lib/components/header/Header.svelte";
  import { user } from "$lib/stores/user";
  import toast from "svelte-french-toast";

  let hasActiveSubscription = false;
  let currentUser;
  $: {
    currentUser = $user;

    if (currentUser && currentUser.subscriptionActive === true) {
      hasActiveSubscription = true;
    }
  }

  let id;
  let name;
  let categories = [];
  let subcategories = [];
  let templates = [];

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

  const extractTemplates = (category, templates = []) => {
    if (category.templates) {
      templates = templates.concat(category.templates);
    }
    if (category.sub) {
      category.sub.forEach((subcategory) => {
        templates = extractTemplates(subcategory, templates);
      });
    }
    return templates;
  };

  const loadCategoryData = async () => {
    const data = $templatesStore;

    console.log("data: ", data);
    if (data) {
      categories = data.map((category) => ({
        ...category,
        open: false,
      }));

      const category = findCategoryById(categories, id);
      console.log("category: ", category);
      if (category) {
        name = category.name;
        subcategories = category.sub || [];
        templates = extractTemplates(category);
        console.log(templates);
      } else {
        console.log("Category not found");
      }
    } else {
      console.log("Categories not found");
    }
  };

  const updateTemplates = () => {
    console.log("$templatesStore updated", $templatesStore);
    const category = findCategoryById(categories, id);
    if (category) {
      templates = extractTemplates(category);
    }

    console.log("templates: ", templates);
  };

  const handleAddCat = async () => {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    const newCategoryName = prompt(
      "Geef een naam in voor de nieuwe categorie:"
    );

    if (newCategoryName) {
      try {
        // Create the new category
        const newCategory = await createCategory(id, newCategoryName);

        // Update the templatesStore directly
        templatesStore.update((templates) => {
          // Recursive function to find the parent category and add the new subcategory
          const addCategoryToParent = (categories) =>
            categories.map((category) => {
              // If current category matches the parent ID, add the new category
              if (category.id === id) {
                return {
                  ...category,
                  sub: [...category.sub, newCategory], // Add new category to sub array
                };
              }

              // If the category has subcategories, recursively update them
              if (category.sub && category.sub.length > 0) {
                return {
                  ...category,
                  sub: addCategoryToParent(category.sub), // Update subcategories recursively
                };
              }

              // Return unchanged if no match found
              return category;
            });

          // Return the updated templates array
          return addCategoryToParent(templates);
        });

        toast.success("Categorie toegevoegd", {
          position: "bottom-right",
        });

        // On success, navigate to the new category page
        goto(`/category/${newCategory.id}`);
      } catch (error) {
        console.error("Error adding category:", error);
        toast.error(error.message, {
          position: "bottom-right",
        });
      }
    }
  };

  const handleAddTemplate = async () => {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    const newTemplateName = prompt("Geef een naam in voor de nieuwe template:");
    if (newTemplateName) {
      try {
        // Create the new category
        const newTemplateId = await createNewTemplate(id, newTemplateName);
        const newTemplate = { name: newTemplateName, id: newTemplateId };

        // Update the templatesStore directly
        templatesStore.update((templates) => {
          // Recursive function to find the parent category and add the new subcategory
          const addTemplateToParent = (categories) =>
            categories.map((category) => {
              // If current category matches the parent ID, add the new category
              if (category.id === id) {
                return {
                  ...category,
                  templates: [...category.templates, newTemplate],
                  open: true,
                };
              }

              // If the category has subcategories, recursively update them
              if (category.sub && category.sub.length > 0) {
                return {
                  ...category,
                  sub: addTemplateToParent(category.sub), // Update subcategories recursively
                };
              }

              // Return unchanged if no match found
              return category;
            });

          // Return the updated templates array
          return addTemplateToParent(templates);
        });

        toast.success("Template toegevoegd", {
          position: "bottom-right",
        });

        goto(`/template/${newTemplateId}#edit`);
      } catch (error) {
        console.error("Error adding category:", error);
        toast.error(error.message, {
          position: "bottom-right",
        });
      }
    }
  };

  // // Load the category data on mount
  // loadCategoryData();

  onMount(() => {
    loadCategoryData();
    if (id) {
    }
  });

  // // Reactive statement to reload category data whenever the ID changes
  $: if (id) {
    loadCategoryData();
  }

  // Reactive statement to update templates whenever templatesStore changes
  $: $templatesStore, loadCategoryData(), updateTemplates();
</script>

<Header />
<div class="category">
  <div class="categories">
    <div class="flex space-between flex-wrap gap-15 align-center mb-20">
      <h2 class="mb-0">Subcategorieën</h2>
      <button
        class="button basic hide_text_mobile has_text"
        on:click={handleAddCat}><Plus size={16} />Categorie toevoegen</button
      >
    </div>
    {#if subcategories.length > 0}
      <div class="categories_grid">
        {#each subcategories as subcategory}
          <Thumbnail
            type={"category"}
            id={subcategory.id}
            name={subcategory.name}
          />
        {/each}
      </div>
    {:else}
      <p class="empty">
        Je hebt nog geen subcategorieën toegevoegd aan <u>{name}</u>. Voeg een
        categorie toe via de knop hierboven
      </p>
    {/if}
  </div>

  <div class="templates">
    <div class="flex space-between flex-wrap gap-15 align-center mb-20">
      <h2 class="mb-0">Templates</h2>
      <button
        class="button basic hide_text_mobile has_text"
        on:click={handleAddTemplate}
        ><Plus size={16} />Template toevoegen</button
      >
    </div>

    {#if templates.length > 0}
      <div class="templates_list">
        {#each templates as template}
          <Thumbnail
            type={"template"}
            id={template.id}
            name={template.name}
            content={template.content}
          />
        {/each}
      </div>
    {:else}
      <p class="empty">
        Je hebt nog geen templates toegevoegd aan <u>{name}</u>. Voeg een
        template toe via de knop hierboven
      </p>
    {/if}
  </div>
</div>

<style lang="scss">
  .category {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .templates {
    margin-top: 20px;
  }

  .templates_list {
    display: grid;
    flex-direction: column;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 480px), 1fr));
    gap: 20px;

    @media (max-width: $xs) {
      gap: 15px;
    }
    .template {
      padding: 15px;
      border-radius: var(--border-radius-small, 5px);
      border: 1px solid var(--border);
      background-color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      text-decoration: none;
      transition:
        background-color 0.2s ease-out,
        border-color 0.2s ease-out;
      &:hover {
        border-color: var(--gray-400);
      }
      &:active {
        color: inherit;
      }
      h3 {
        font-size: 1.6rem;
        flex-grow: 1;
        margin-bottom: 0;
      }
    }
  }

  .placeholder {
    padding: 20px;
    background-color: var(--gray-200);
    border-radius: var(--border-radius);
    font-size: 1.4rem;
  }
</style>
