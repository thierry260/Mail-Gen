<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import {
    db,
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
  } from "$lib/firebase"; // Correct import path

  let workspaceVariables = {};
  let selectedVariable = "";
  let newVariable = { field_name: "", placeholder: "" };
  let templateName = "";
  let templateContent = "";
  let categoryId = "";
  let inputRef; // Reference to the input element
  let showVariablePopup = false; // State to control the popup visibility
  let variableSearchQuery = ""; // Query for variable search
  let showPlaceholderField = false; // State to control placeholder field visibility

  $: {
    categoryId = $page.params.id;
  }

  // Fetch existing variables from the workspace
  const fetchVariables = async () => {
    const docRef = doc(db, "workspaces", localStorage.getItem("workspace"));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      workspaceVariables = docSnap.data().variables || {};
      console.log("Workspace Variables:", workspaceVariables);
    } else {
      console.log("No such document!");
    }
  };

  const extractVariablesFromContent = (content) => {
    const regex = /{{(.*?)}}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  };

  const addTemplateToCategory = async (templateId) => {
    const docRef = doc(db, "workspaces", localStorage.getItem("workspace"));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      let categories = docSnap.data().categories || [];

      const findAndAddTemplate = (categories) => {
        for (let category of categories) {
          if (category.id === categoryId) {
            category.templates = category.templates || [];
            category.templates.push({ id: templateId, name: templateName });
            return true;
          }
          if (category.sub) {
            if (findAndAddTemplate(category.sub)) {
              return true;
            }
          }
        }
        return false;
      };

      findAndAddTemplate(categories);

      await updateDoc(docRef, {
        categories: categories,
      });
    }
  };

  const addTemplate = async () => {
    try {
      const usedVariables = extractVariablesFromContent(templateContent);
      const newTemplate = {
        content: templateContent,
        name: templateName,
        variables: usedVariables,
      };
      const docRef = await addDoc(
        collection(
          db,
          "workspaces",
          localStorage.getItem("workspace"),
          "templates"
        ),
        newTemplate
      );
      console.log("Template added with ID: ", docRef.id);

      // Add template ID to the category
      await addTemplateToCategory(docRef.id);

      // Optionally, redirect to another page or show success message
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const addNewVariable = async () => {
    if (newVariable.field_name && newVariable.placeholder) {
      const id =
        "var_" +
        Date.now().toString(36) +
        Math.random().toString(36).substr(2, 9);
      workspaceVariables = { ...workspaceVariables, [id]: newVariable };

      // Update the Firestore document with the new variable
      const docRef = doc(db, "workspaces", localStorage.getItem("workspace"));
      await updateDoc(docRef, {
        [`variables.${id}`]: newVariable,
      });

      newVariable = { field_name: "", placeholder: "" };
      selectedVariable = id;
    }
  };

  const insertVariable = (variable) => {
    templateContent += ` {{${variable}}} `;
    showVariablePopup = false;
    variableSearchQuery = "";
    showPlaceholderField = false;
  };

  const handleVariableSearch = (e) => {
    variableSearchQuery = e.target.value;
    const existingVariable = Object.entries(workspaceVariables).find(
      ([id, data]) =>
        data.field_name.toLowerCase() === variableSearchQuery.toLowerCase()
    );

    if (existingVariable) {
      // If existing variable is found
      selectedVariable = existingVariable[0];
      showPlaceholderField = false;
    } else if (variableSearchQuery) {
      // If no existing variable is found, allow adding new variable
      selectedVariable = "";
      newVariable.field_name = variableSearchQuery;
      showPlaceholderField = true;
    } else {
      showPlaceholderField = false;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (selectedVariable) {
        insertVariable(selectedVariable);
      } else if (newVariable.field_name && newVariable.placeholder) {
        addNewVariable();
        insertVariable(newVariable.field_name);
      }
    }
  };

  onMount(() => {
    fetchVariables();
    inputRef.focus(); // Focus the input element when the component mounts
  });
</script>

<h1>Template toevoegen</h1>
<input
  type="text"
  placeholder="Template naam"
  bind:value={templateName}
  bind:this={inputRef}
/>

<div>
  <h2>Template details</h2>
  <textarea placeholder="Email inhoud" bind:value={templateContent}></textarea>
</div>

<button on:click={() => (showVariablePopup = true)}>Voeg Variabele Toe</button>

{#if showVariablePopup}
  <div class="popup">
    <h2>Voeg een variabele toe</h2>
    <input
      type="text"
      placeholder="Variabele naam"
      bind:value={variableSearchQuery}
      on:input={handleVariableSearch}
      on:keypress={handleKeyPress}
    />
    {#if variableSearchQuery && !showPlaceholderField}
      <ul>
        {#each Object.entries(workspaceVariables).filter( ([id, data]) => data.field_name
              .toLowerCase()
              .includes(variableSearchQuery.toLowerCase()) ) as [id, data]}
          <li on:click={() => insertVariable(data.field_name)}>
            {data.field_name}
          </li>
        {/each}
      </ul>
    {/if}
    {#if showPlaceholderField}
      <input
        type="text"
        placeholder="Placeholder"
        bind:value={newVariable.placeholder}
        on:keypress={handleKeyPress}
      />
    {/if}
    <button on:click={() => (showVariablePopup = false)}>Sluiten</button>
  </div>
{/if}

<!-- Save Template Button -->
<button on:click={addTemplate}>Save</button>

<style>
  input,
  textarea,
  select {
    display: block;
    width: 100%;
    margin-bottom: 10px;
    padding: 8px;
  }

  textarea {
    height: 200px;
  }

  button {
    padding: 10px 20px;
    margin-top: 10px;
    cursor: pointer;
  }

  h2 {
    margin-top: 20px;
  }

  .popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .popup input {
    margin-bottom: 10px;
  }

  .popup button {
    margin-right: 10px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 10px 0;
  }

  li {
    padding: 10px;
    background: #f0f0f0;
    margin-bottom: 5px;
    cursor: pointer;
  }

  li:hover {
    background: #e0e0e0;
  }
</style>
