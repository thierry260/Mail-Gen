<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { fetchWorkspaceData, fetchTemplateData } from "$lib/utils/get";
  import { get } from "svelte/store";
  import { browser } from "$app/environment";

  let id;
  let templateData = {};
  let workspaceVariables = {};
  let userInput = {};
  let isNextStage = false; // Control the visibility of stages
  let userName = "";
  let userEmail = "";
  let cc = "";
  let bcc = "";
  let isActive = false;

  // Subscribe to the page store to get the ID parameter
  $: id = $page.params.id;

  // Fetch all data for the component
  const fetchWorkspaceAndTemplateData = async () => {
    templateData = await fetchTemplateData(id);
    workspaceVariables = await fetchWorkspaceData();

    // Initialize user input fields with placeholders
    if (templateData.variables && workspaceVariables.variables) {
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
  };

  // Perform any necessary actions when the component mounts or ID changes
  $: {
    if (id) {
      console.log("Fetching template details for template ID:", id);
      fetchWorkspaceAndTemplateData();
    }
  }

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
</script>

{#if templateData.content}
  {#if !isNextStage}
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
