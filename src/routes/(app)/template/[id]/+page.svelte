<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { fetchWorkspaceData, fetchTemplateData } from "$lib/utils/get";
  import { deleteTemplate } from "$lib/utils/delete";
  import { get } from "svelte/store";
  import { browser } from "$app/environment";
  import { updateDoc, doc } from "firebase/firestore"; // Import Firestore update function
  import { db } from "$lib/firebase"; // Adjust the import path if necessary
  import { Star, TrashSimple, PencilSimple, X } from "phosphor-svelte";

  let id;
  let templateData = {};
  let workspaceVariables = { variables: {} }; // Ensure workspaceVariables is initialized with a default structure
  let userInput = {};
  let isNextStage = false; // Control the visibility of stages
  let userName = "";
  let userEmail = "";
  let cc = "";
  let bcc = "";
  let isActive = false;
  let isEditMode = false; // Toggle for edit mode
  let selectedVariable = ""; // Track the selected variable for insertion
  let isFavorite = false;

  // Subscribe to the page store to get the ID parameter
  $: id = $page.params.id;

  // Fetch all data for the component
  const fetchWorkspaceAndTemplateData = async () => {
    try {
      templateData = await fetchTemplateData(id);
      workspaceVariables = (await fetchWorkspaceData()) || { variables: {} }; // Ensure workspaceVariables is not null

      // Ensure workspaceVariables has a variables property
      if (!workspaceVariables.variables) {
        workspaceVariables.variables = {};
      }

      // Initialize user input fields with placeholders
      if (templateData.variables) {
        userInput = {}; // Reset userInput to avoid carrying over data from previous templates
        templateData.variables.forEach((variableId) => {
          if (workspaceVariables.variables[variableId]) {
            userInput[variableId] =
              workspaceVariables.variables[variableId].placeholder || "";
          }
        });
      }

      templateData.id = id;

      // Save to localStorage as recently viewed template
      saveRecentlyViewedTemplate(templateData);

      // Load favorite state after fetching template data
      loadFavoriteState();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Perform any necessary actions when the component mounts or ID changes
  $: {
    if (id) {
      console.log("Fetching template details for template ID:", id);
      fetchWorkspaceAndTemplateData();
    }
  }

  const toggleFavorite = () => {
    isFavorite = !isFavorite;
    saveFavoriteState();
  };

  const saveFavoriteState = () => {
    if (browser) {
      let favoriteTemplates =
        JSON.parse(localStorage.getItem("favoriteTemplates")) || [];

      const index = favoriteTemplates.findIndex(
        (item) => item.id === templateData.id
      );

      if (isFavorite && index === -1) {
        favoriteTemplates.unshift(templateData);
      } else if (!isFavorite && index !== -1) {
        favoriteTemplates.splice(index, 1);
      }

      localStorage.setItem(
        "favoriteTemplates",
        JSON.stringify(favoriteTemplates)
      );
    } else {
      console.warn("localStorage is not available in this environment.");
    }
  };

  const loadFavoriteState = () => {
    if (browser) {
      let favoriteTemplates =
        JSON.parse(localStorage.getItem("favoriteTemplates")) || [];

      isFavorite = favoriteTemplates.some(
        (item) => item.id === templateData.id
      );
    } else {
      console.warn("localStorage is not available in this environment.");
    }
  };

  onMount(() => {
    if (id) {
      fetchWorkspaceAndTemplateData();
    }
  });

  // Replace variables in content based on user input
  const replaceVariables = (content, variables) => {
    if (!content) return ""; // Check if content is defined

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
    if (browser) {
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
    } else {
      console.warn("localStorage is not available in this environment.");
    }
  };

  // Move to the prev stage
  const prevPage = () => {
    isNextStage = false;
  };

  // Move to the next stage
  const nextPage = () => {
    isNextStage = true;
  };

  // Handle the send button click
  const sendEmail = () => {
    console.log({
      name: userName,
      email: userEmail,
      cc: cc,
      bcc: bcc,
      content: document.querySelector(".preview-content").innerHTML,
    });
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    isEditMode = !isEditMode;
  };

  const confirmAndDelete = () => {
    const confirmDelete = window.confirm(
      "Weet je zeker dat je deze template wilt verwijderen?"
    );
    if (confirmDelete) {
      deleteTemplate(templateData.id)
        .then(() => {
          // Handle success, e.g., show success message or redirect
          console.log("Template deleted successfully");
        })
        .catch((error) => {
          // Handle error, e.g., show error message
          console.error("Error deleting template:", error);
        });
    }
  };

  // Handle save button click
  const saveTemplate = async () => {
    try {
      // Update the template data with the current content, name, and variables
      await updateDoc(doc(db, "workspaces/wms/templates", id), {
        content: templateData.content,
        name: templateData.name,
        variables: templateData.variables,
      });
      toggleEditMode();
      fetchWorkspaceAndTemplateData(); // Refresh the data
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  // Insert a variable into the template content
  const insertVariable = () => {
    if (selectedVariable) {
      templateData.content += ` {{${selectedVariable}}} `;
      selectedVariable = "";
    }
  };
</script>

{#if templateData.content}
  {#if !isNextStage}
    <div class="top">
      <h1>
        Template:
        {templateData.name}
      </h1>
      <button class="button basic" on:click={toggleEditMode}>
        {#if isEditMode}
          <X size="18" />Annuleren
        {:else}
          <PencilSimple size="18" />Aanpassen
        {/if}
      </button>
      {#if !isEditMode}
        <button class="button basic" on:click={confirmAndDelete}>
          <TrashSimple size="18" />
        </button>
        <button class="button basic favorite_button" on:click={toggleFavorite}>
          {#if isFavorite}
            <Star size="18" weight="fill" />
          {:else}
            <Star size="18" />
          {/if}
        </button>
      {/if}
    </div>
    {#if isEditMode}
      <div class="edit-template">
        <input
          type="text"
          bind:value={templateData.name}
          placeholder="Template naam"
        />
        <textarea bind:value={templateData.content} placeholder="Email inhoud"
        ></textarea>
        <div>
          <h2>Variabele selecteren</h2>
          <select bind:value={selectedVariable}>
            <option value="" disabled>Selecteer</option>
            {#each Object.entries(workspaceVariables.variables) as [variableId, variableData]}
              <option value={variableId}>{variableData.field_name}</option>
            {/each}
          </select>
          <button on:click={insertVariable}>Voeg toe</button>
        </div>
        <button on:click={saveTemplate}>Opslaan</button>
      </div>
    {:else}
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
                  placeholder={workspaceVariables.variables[variableId]
                    .placeholder}
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
        <div class="buttons">
          <button class="button outline" on:click={copyToClipboard}
            >Kopieer</button
          >
          <button class="button" on:click={nextPage}>Volgende</button>
        </div>
      </div>
    {/if}
  {:else}
    <h1>Send Email</h1>
    <div class="email-details">
      <div>
        <label for="userName">Name</label>
        <input
          type="text"
          id="userName"
          bind:value={userName}
          placeholder="Your Name"
        />
      </div>
      <div>
        <label for="userEmail">Email</label>
        <input
          type="email"
          id="userEmail"
          bind:value={userEmail}
          placeholder="Your Email"
        />
      </div>
      <div>
        <label for="cc">CC</label>
        <input type="email" id="cc" bind:value={cc} placeholder="CC" />
      </div>
      <div>
        <label for="bcc">BCC</label>
        <input type="email" id="bcc" bind:value={bcc} placeholder="BCC" />
      </div>
    </div>
    <div class="preview">
      <h2>Generated Email Content</h2>
      <div class="preview-content">
        {@html replaceVariables(templateData.content, userInput)}
      </div>
      <button class="button outline" on:click={prevPage}>Vorige</button>
      <button class="button" on:click={sendEmail}>Versturen</button>
    </div>
  {/if}
{/if}

<style lang="scss">
  .top {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 20px;
    h1 {
      flex-grow: 1;
      margin-bottom: 0;
    }
  }
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
      background-color: #fff;
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
  .email-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    > div {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
  }
</style>
