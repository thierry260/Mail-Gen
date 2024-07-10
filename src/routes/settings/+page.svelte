<script>
  import { onMount } from "svelte";
  import { doc, getDoc, updateDoc } from "firebase/firestore";
  import db from "$lib/firebase"; // Adjust the import path if necessary

  let workspaceVariables = {};
  let newVariable = { field_name: "", placeholder: "" };

  // Fetch all workspace variables when the component mounts
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

  const saveVariables = async () => {
    const docRef = doc(db, "workspaces", "wms");
    await updateDoc(docRef, { variables: workspaceVariables });
    console.log("Variables saved successfully");
  };

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  };

  const addVariable = () => {
    if (newVariable.field_name && newVariable.placeholder) {
      const id = generateUniqueId();
      workspaceVariables = {
        ...workspaceVariables,
        [id]: {
          field_name: newVariable.field_name,
          placeholder: newVariable.placeholder,
        },
      };
      newVariable = { field_name: "", placeholder: "" };
      saveVariables();
    }
  };

  const updateVariable = (id, field, value) => {
    workspaceVariables[id][field] = value;
    saveVariables();
  };

  const removeVariable = (id) => {
    delete workspaceVariables[id];
    saveVariables();
  };

  onMount(() => {
    fetchVariables();
  });
</script>

<h1>Variables</h1>

<!-- Add New Variable Form -->
<div>
  <h2>New variable</h2>
  <input
    type="text"
    placeholder="Field Name"
    bind:value={newVariable.field_name}
  />
  <input
    type="text"
    placeholder="Placeholder"
    bind:value={newVariable.placeholder}
  />
  <button on:click={addVariable}>Add Variable</button>
</div>

<!-- Existing Variables Table -->
{#if Object.keys(workspaceVariables).length > 0}
  <table>
    <thead>
      <tr>
        <th>Variable ID</th>
        <th>Field Name</th>
        <th>Placeholder</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each Object.entries(workspaceVariables) as [variableId, variableData]}
        <tr>
          <td>{variableId}</td>
          <td>
            <input
              type="text"
              value={variableData.field_name}
              on:input={(e) =>
                updateVariable(variableId, "field_name", e.target.value)}
            />
          </td>
          <td>
            <input
              type="text"
              value={variableData.placeholder}
              on:input={(e) =>
                updateVariable(variableId, "placeholder", e.target.value)}
            />
          </td>
          <td>
            <button on:click={() => removeVariable(variableId)}>Remove</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p>Loading variables...</p>
{/if}

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }

  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tr:hover {
    background-color: #f1f1f1;
  }

  h1 {
    text-align: center;
    margin-bottom: 20px;
  }

  h2 {
    margin-top: 20px;
  }

  input[type="text"] {
    width: 100%;
    padding: 8px;
    margin: 5px 0;
  }

  button {
    padding: 8px 16px;
    margin: 5px 0;
    cursor: pointer;
  }

  div {
    margin-bottom: 20px;
  }
</style>
