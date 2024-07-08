<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { fetchWorkspaceData } from "$lib/fetch/workspace";
  import { fetchTemplateData } from "$lib/fetch/template";
  import Breadcrumbs from "$lib/components/header/Breadcrumbs.svelte";

  let id;
  let templateData = {};
  let workspaceVariables = {};
  let userInput = {};

  // Subscribe to the page store to get the ID parameter
  $: id = $page.params.id;

  // Fetch all data for the component
  const fetchWorkspaceAndTemplateData = async () => {
    templateData = await fetchTemplateData(id);
    workspaceVariables = await fetchWorkspaceData();

    // Initialize user input fields with placeholders
    if (templateData.variables && workspaceVariables.variables) {
      templateData.variables.forEach((variableId) => {
        if (workspaceVariables.variables[variableId]) {
          userInput[variableId] =
            workspaceVariables.variables[variableId].placeholder || "";
        }
      });
    }

    // Save to localStorage as recently viewed template
    saveRecentlyViewedTemplate(templateData);
  };

  // Perform any necessary actions when the component mounts
  onMount(() => {
    console.log("Fetching template details for template ID:", id);
    fetchWorkspaceAndTemplateData();
  });

  // Replace variables in content based on user input
  const replaceVariables = (content, variables) => {
    return content.replace(/{{(.*?)}}/g, (match, p1) => {
      const value = variables[p1] || match;
      return `<span class="variable" on:click={handleVariableClick.bind(null, p1)}>${value}</span>`;
    });
  };

  // Handle click on variable span
  const handleVariableClick = (variableId) => {
    console.log("Clicked variable:", variableId);
    const inputElement = document.getElementById(variableId);
    console.log("Input element:", inputElement);
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  };

  // Copy the generated content to clipboard
  const copyToClipboard = async () => {
    const content = document.querySelector(".preview-content").innerText;
    try {
      await navigator.clipboard.writeText(content);
      console.log(`Copied to clipboard:\n\n${content}`);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // Function to save the recently viewed template to localStorage
  const saveRecentlyViewedTemplate = (template) => {
    let recentlyViewed =
      JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    // Check if the template is already in the recently viewed list
    const index = recentlyViewed.findIndex((item) => item.id === template.id);
    if (index !== -1) {
      recentlyViewed.splice(index, 1); // Remove the template from the list to re-add it later
    }
    recentlyViewed.unshift(template); // Add the template at the beginning of the array
    // Limit to storing only the last 4 viewed templates
    if (recentlyViewed.length > 4) {
      recentlyViewed = recentlyViewed.slice(0, 4);
    }
    localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
  };

  const nextPage = async () => {
    console.log("volgende pagina");
  };
</script>

{#if templateData.content}
  <h1>{templateData.name}</h1>
  <div class="template">
    <div class="variables">
      {#each Object.keys(userInput) as variableId}
        {#if workspaceVariables.variables && workspaceVariables.variables[variableId]}
          <div>
            <label class="label" for={variableId}>
              {workspaceVariables.variables[variableId].field_name}
            </label>
            <input
              type="text"
              id={variableId}
              bind:value={userInput[variableId]}
              placeholder={workspaceVariables.variables[variableId].placeholder}
            />
          </div>
        {/if}
      {/each}
    </div>
    <div class="preview">
      <div class="preview-content">
        {@html replaceVariables(templateData.content, userInput)}
      </div>
    </div>
    <button on:click={copyToClipboard}>Copy</button>
    <button on:click={nextPage}>Next</button>
  </div>
{/if}

<style lang="scss">
  .template {
    display: flex;
    flex-direction: column;
    gap: 20px;
    .variables {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      > * {
        display: flex;
        flex-direction: column;
        gap: 0;
      }
    }
    .preview {
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      padding: 30px;
      h2 {
        border-bottom: 1px solid var(--border);
        padding-bottom: 0.5em;
      }
      .preview-content {
        line-height: 1.5;
      }
      .variable {
        text-decoration: underline; /* Voor onderstreping */
        cursor: pointer; /* Verander cursor naar pointer bij hover */
        /* Of gebruik bijvoorbeeld background-color voor achtergrondmarkering */
      }
    }
  }
</style>
