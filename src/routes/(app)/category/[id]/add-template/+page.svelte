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

  $: {
    categoryId = $page.params.id;
  }

  // Fetch existing variables from the workspace
  const fetchVariables = async () => {
    const docRef = doc(db, "workspaces", "wms");
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
    const docRef = doc(db, "workspaces", "wms");
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
        collection(db, "workspaces", "wms", "templates"),
        newTemplate,
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
      const docRef = doc(db, "workspaces", "wms");
      await updateDoc(docRef, {
        [`variables.${id}`]: newVariable,
      });

      newVariable = { field_name: "", placeholder: "" };
      selectedVariable = id;
    }
  };

  const insertVariable = () => {
    if (selectedVariable) {
      templateContent += ` {{${selectedVariable}}} `;
      selectedVariable = "";
    }
  };

  onMount(() => {
    fetchVariables();
  });
</script>

<h1>Template toevoegen</h1>

<!-- Existing Variables Selection -->
<div>
  <h2>1: Variabele selecteren</h2>
  <select bind:value={selectedVariable}>
    <option value="" disabled>Selecteer</option>
    {#each Object.entries(workspaceVariables) as [variableId, variableData]}
      <option value={variableId}>{variableData.field_name}</option>
    {/each}
  </select>
  <button on:click={insertVariable}>Voeg toe</button>
</div>

<!-- New Template Form -->
<div>
  <h2>2: Template details</h2>
  <input type="text" placeholder="Template naam" bind:value={templateName} />
  <textarea placeholder="Email inhoud" bind:value={templateContent}></textarea>
</div>

<!-- Add New Variable -->
<div>
  <h2>Variabelen toevoegen</h2>
  <input type="text" placeholder="Naam" bind:value={newVariable.field_name} />
  <input
    type="text"
    placeholder="Placeholder"
    bind:value={newVariable.placeholder}
  />
  <button on:click={addNewVariable}>Voeg toe</button>
</div>

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
</style>
