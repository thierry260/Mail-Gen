<script>
  import { onMount } from "svelte";
  import { doc, getDoc, updateDoc } from "firebase/firestore";
  import { db, auth } from "$lib/firebase";
  import { browser } from "$app/environment";
  import { writable } from "svelte/store";
  import {
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword,
  } from "firebase/auth";
  import { page } from "$app/stores";

  let workspaceVariables = {};
  let newVariable = { field_name: "", placeholder: "" };
  let currentPassword = "";
  let newPassword = "";
  let passwordError = writable("");
  let passwordSuccess = writable("");
  let inviteEmail = "";
  let inviteLink = writable("");
  let inviteError = writable("");
  let inviteSuccess = writable("");
  let workspaceName = "";
  let workspaceNameError = writable("");
  let workspaceNameSuccess = writable("");

  // Fetch all workspace variables when the component mounts
  const fetchVariables = async () => {
    if (!browser) return;

    const workspaceId = localStorage.getItem("workspace");
    if (!workspaceId) {
      console.error("Workspace ID not found in localStorage");
      return;
    }

    const docRef = doc(db, "workspaces", workspaceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const workspaceData = docSnap.data();
      workspaceVariables = workspaceData.variables || {};
      workspaceName = workspaceData.name || "";
      console.log("Workspace Variables:", workspaceVariables);
    } else {
      console.log("No such document!");
    }
  };

  const saveVariables = async () => {
    if (!browser) return;

    const workspaceId = localStorage.getItem("workspace");
    if (!workspaceId) {
      console.error("Workspace ID not found in localStorage");
      return;
    }

    const docRef = doc(db, "workspaces", workspaceId);
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

  // Function to handle password change
  const handleChangePassword = async () => {
    passwordError.set("");
    passwordSuccess.set("");

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );

      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);
      passwordSuccess.set("Wachtwoord aangepast.");
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        passwordError.set("Huidig wachtwoord onjuist");
      } else {
        passwordError.set(error.message);
      }
    }
  };

  // Function to handle workspace name change
  const handleChangeWorkspaceName = async () => {
    workspaceNameError.set("");
    workspaceNameSuccess.set("");

    try {
      const workspaceId = localStorage.getItem("workspace");
      if (!workspaceId) {
        throw new Error("Workspace ID not found in localStorage");
      }

      const docRef = doc(db, "workspaces", workspaceId);
      await updateDoc(docRef, { name: workspaceName });
      workspaceNameSuccess.set("Workspacenaam aangepast.");
    } catch (error) {
      workspaceNameError.set(error.message);
    }
  };

  // Function to generate invite link
  const generateInviteLink = async () => {
    inviteError.set("");
    inviteSuccess.set("");

    try {
      const workspaceId = localStorage.getItem("workspace");
      if (!workspaceId) {
        throw new Error("Workspace ID not found in localStorage");
      }

      const inviteId = btoa(`${workspaceId},${inviteEmail}`);
      const link = `${window.location.origin}/register?id=${inviteId}`;
      inviteLink.set(link);
      inviteSuccess.set("Uitnodigingslink gegenereerd.");
    } catch (error) {
      inviteError.set(error.message);
    }
  };

  onMount(() => {
    fetchVariables();
  });
</script>

<h1>Instellingen</h1>

<!-- Add New Variable Form -->
<div class="settings">
  <h2>Variabelen managen</h2>
  <input type="text" placeholder="Naam" bind:value={newVariable.field_name} />
  <input
    type="text"
    placeholder="Placeholder"
    bind:value={newVariable.placeholder}
  />
  <button on:click={addVariable}>Voeg toe</button>
</div>

<!-- Existing Variables Table -->
{#if Object.keys(workspaceVariables).length > 0}
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Naam</th>
        <th>Placeholder</th>
        <th></th>
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
            <button on:click={() => removeVariable(variableId)}
              >Verwijder</button
            >
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p>Loading variables...</p>
{/if}

<!-- Change Workspace Name Section -->
<div class="change-workspace-name">
  <h2>Workspacenaam wijzigen</h2>
  <input
    type="text"
    placeholder="Nieuwe workspacenaam"
    bind:value={workspaceName}
  />
  <button on:click={handleChangeWorkspaceName}>Workspacenaam wijzigen</button>
  {#if $workspaceNameError}
    <p style="color: red">{$workspaceNameError}</p>
  {/if}
  {#if $workspaceNameSuccess}
    <p style="color: green">{$workspaceNameSuccess}</p>
  {/if}
</div>

<!-- Change Password Section -->
<div class="change-password">
  <h2>Wachtwoord wijzigen</h2>
  <input
    type="password"
    placeholder="Huidig wachtwoord"
    bind:value={currentPassword}
  />
  <input
    type="password"
    placeholder="Nieuw wachtwoord"
    bind:value={newPassword}
  />
  <button on:click={handleChangePassword}>Wachtwoord wijzigen</button>
  {#if $passwordError}
    <p style="color: red">{$passwordError}</p>
  {/if}
  {#if $passwordSuccess}
    <p style="color: green">{$passwordSuccess}</p>
  {/if}
</div>

<!-- Invite to Workspace Section -->
<div class="invite-to-workspace">
  <h2>Uitnodigen voor Workspace</h2>
  <input type="email" placeholder="E-mailadres" bind:value={inviteEmail} />
  <button on:click={generateInviteLink}>Genereer uitnodigingslink</button>
  {#if $inviteError}
    <p style="color: red">{$inviteError}</p>
  {/if}
  {#if $inviteSuccess}
    <p style="color: green">{$inviteSuccess}</p>
  {/if}
  {#if $inviteLink}
    <p>
      Uitnodigingslink: <a href={$inviteLink} target="_blank">{$inviteLink}</a>
    </p>
  {/if}
</div>

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

  input[type="text"],
  input[type="password"],
  input[type="email"] {
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

  .invite-to-workspace p {
    margin-top: 10px;
  }
</style>
