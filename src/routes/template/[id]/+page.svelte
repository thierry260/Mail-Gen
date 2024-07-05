<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { doc, getDoc } from "firebase/firestore";
  import db from "$lib/firebase"; // Use the alias '@' to refer to the 'src' directory

  let id;
  let templateData = {};
  let workspaceVariables = {};
  let userInput = {};

  // Subscribe to the page store to get the ID parameter
  $: id = $page.params.id;

  //Ale data voor component ophalen
  const fetchWorkspaceAndTemplateData = async (id) => {
    //Template data
    const templateDocRef = doc(db, "workspaces", "wms", "templates", id);
    const templateDocSnap = await getDoc(templateDocRef);

    if (templateDocSnap.exists()) {
      templateData = templateDocSnap.data();
      console.log("Template Data:", templateData);
    } else {
      console.log("No such document!");
      return;
    }

    //Alle variabelen uit de workspace, later localstorage
    const workspaceDocRef = doc(db, "workspaces", "wms");
    const workspaceDocSnap = await getDoc(workspaceDocRef);

    if (workspaceDocSnap.exists()) {
      workspaceVariables = workspaceDocSnap.data().variables;
      console.log("Workspace Variables:", workspaceVariables);
    } else {
      console.log("No such workspace document!");
    }

    //Input fields met placeholders initialiseren
    if (templateData.variables) {
      templateData.variables.forEach((variableId) => {
        if (workspaceVariables[variableId]) {
          userInput[variableId] =
            workspaceVariables[variableId].placeholder || "";
        }
      });
    }
  };

  // Perform any necessary actions when the component mounts
  onMount(() => {
    console.log("Fetching template details for template ID:", id);
    fetchWorkspaceAndTemplateData(id);
  });

  //Variabelen na userinput aanpassen in content
  const replaceVariables = (content, variables) => {
    return content.replace(/{{(.*?)}}/g, (match, p1) => {
      return variables[p1] || match;
    });
  };
</script>

<h1>Template Details</h1>
<p>Template ID: {id}</p>
{#if templateData.content}
  <div>
    <h2>Variabelen vullen:</h2>
    {#each templateData.variables as variableId}
      {#if workspaceVariables[variableId]}
        <div>
          <label for={variableId}
            >{workspaceVariables[variableId].field_name}:</label
          >
          <input
            type="text"
            id={variableId}
            bind:value={userInput[variableId]}
            placeholder={workspaceVariables[variableId].placeholder}
          />
        </div>
      {/if}
    {/each}
    <h2>Mailtemplate:</h2>
    <div>
      <pre>{replaceVariables(templateData.content, userInput)}</pre>
    </div>
  </div>
{/if}
