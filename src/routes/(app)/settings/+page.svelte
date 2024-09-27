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
  import { TrashSimple } from "phosphor-svelte";
  import { loadStripe } from "@stripe/stripe-js";
  import Header from "$lib/components/header/Header.svelte";

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
  let activeTab = "variables";
  let stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  let errorMessage = "";
  let subscriptionActive = false;
  let daysLeft = 0;

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
    if (confirm("Weet je zeker dat je deze variabele wilt verwijderen?")) {
      delete workspaceVariables[id];
      workspaceVariables = workspaceVariables;
      saveVariables();
    }
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
      const link = `${window.location.origin}/get-mailgen?id=${inviteId}`;
      inviteLink.set(link);
      inviteSuccess.set("Uitnodigingslink gegenereerd.");
    } catch (error) {
      inviteError.set(error.message);
    }
  };

  const checkSubscription = async () => {
    const customerId = "cus_QvSrargE0AEThh";

    try {
      const response = await fetch("http://localhost:3000/check-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId }),
      });

      const data = await response.json();

      console.log(data);

      if (data.active) {
        subscriptionActive = true;
        daysLeft = data.days_left;
      } else {
        subscriptionActive = false;
      }
    } catch (err) {
      errorMessage = err.message;
    }
  };

  onMount(async () => {
    fetchVariables();
    checkSubscription();
  });

  const subscribe = async () => {
    try {
      const workspaceId = localStorage.getItem("workspace");
      const userId = auth.currentUser.uid;
      const response = await fetch(
        "http://localhost:3000/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId: "price_1Q2td6CfSGPTfKftLJ5CLqAe", // Your Price ID
            email: auth.currentUser.email, // Pass the user's email
            workspaceId: workspaceId, // Pass the workspaceId
            userId: userId, // Pass the userId
          }),
        }
      );

      const data = await response.json();

      if (data.sessionId) {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (error) {
          errorMessage = error.message;
        }
      } else {
        throw new Error("SessionId missing");
      }
    } catch (err) {
      errorMessage = err.message;
    }
  };
</script>

<Header type={"settings"} />

<!-- Tab Navigation -->
<div class="tabs">
  <button
    class:active={activeTab === "variables"}
    on:click={() => (activeTab = "variables")}>Variabelen</button
  >
  <button
    class:active={activeTab === "account"}
    on:click={() => (activeTab = "account")}>Account</button
  >
  <button
    class:active={activeTab === "workspace"}
    on:click={() => (activeTab = "workspace")}>Workspace</button
  >
  <button
    class:active={activeTab === "subscription"}
    on:click={() => (activeTab = "subscription")}>Abonnement</button
  >
</div>

<!-- Tab Content -->
{#if activeTab === "variables"}
  <div class="tab-content">
    <div class="card">
      <h4>Toevoegen</h4>
      <div class="form">
        <input
          type="text"
          placeholder="Naam"
          bind:value={newVariable.field_name}
        />
        <input
          type="text"
          placeholder="Placeholder"
          bind:value={newVariable.placeholder}
        />
        <button class="button" on:click={addVariable}>+ Voeg toe</button>
      </div>
    </div>
    <div class="card">
      <h4>Beheren</h4>

      {#if Object.keys(workspaceVariables).length > 0}
        <ul class="manage_vars">
          {#each Object.entries(workspaceVariables) as [variableId, variableData]}
            <li>
              <label class="input_wrapper">
                <input
                  type="text"
                  value={variableData.field_name}
                  placeholder="&nbsp;"
                  on:input={(e) =>
                    updateVariable(variableId, "field_name", e.target.value)}
                />
                <span>Naam</span>
              </label>
              <label class="input_wrapper">
                <input
                  type="text"
                  value={variableData.placeholder}
                  placeholder="&nbsp;"
                  on:input={(e) =>
                    updateVariable(variableId, "placeholder", e.target.value)}
                />
                <span>Placeholder</span>
              </label>
              <button
                class="button basic"
                data-tooltip="Verwijderen"
                data-flow="top"
                on:click={() => removeVariable(variableId)}
                ><TrashSimple size="18" /></button
              >
            </li>{/each}
        </ul>
      {:else}
        <p>Loading variables...</p>
      {/if}
    </div>
  </div>
{:else if activeTab === "account"}
  <div class="tab-content">
    <div class="card">
      <h4>Wachtwoord wijzigen</h4>
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
      <button class="button" on:click={handleChangePassword}
        >Wachtwoord wijzigen</button
      >
      {#if $passwordError}
        <p style="color: red">{$passwordError}</p>
      {/if}
      {#if $passwordSuccess}
        <p style="color: green">{$passwordSuccess}</p>
      {/if}
    </div>
  </div>
{:else if activeTab === "workspace"}
  <div class="tab-content">
    <div class="card">
      <h4>Workspacenaam wijzigen</h4>
      <input
        type="text"
        placeholder="Nieuwe workspacenaam"
        bind:value={workspaceName}
      />
      <button class="button" on:click={handleChangeWorkspaceName}
        >Workspacenaam wijzigen</button
      >
      {#if $workspaceNameError}
        <p style="color: red">{$workspaceNameError}</p>
      {/if}
      {#if $workspaceNameSuccess}
        <p style="color: green">{$workspaceNameSuccess}</p>
      {/if}
    </div>
    <div class="card">
      <h4>Uitnodigen voor Workspace</h4>
      <input type="email" placeholder="E-mailadres" bind:value={inviteEmail} />
      <button class="button" on:click={generateInviteLink}
        >Genereer uitnodigingslink</button
      >
      {#if $inviteError}
        <p style="color: red">{$inviteError}</p>
      {/if}
      {#if $inviteSuccess}
        <p style="color: green">{$inviteSuccess}</p>
      {/if}
      {#if $inviteLink}
        <p>
          Uitnodigingslink: <a href={$inviteLink} target="_blank"
            >{$inviteLink}</a
          >
        </p>
      {/if}
    </div>
  </div>
{:else if activeTab === "subscription"}
  <div class="tab-content">
    <h2>Abonnement</h2>
    {#if subscriptionActive}
      <p>Je hebt nog {daysLeft} dagen in je abonnement.</p>
      <button on:click={console.log("canceljemoeder")}
        >Abonnement annuleren</button
      >
    {:else}
      <button on:click={subscribe}>Subscribe Now</button>
    {/if}

    {#if errorMessage}
      <p style="color: red;">{errorMessage}</p>
    {/if}
  </div>
{/if}

<style lang="scss">
  .tabs {
    display: flex;
    // justify-content: center;
    gap: 30px;
    margin-top: 50px;
    margin-bottom: 25px;
    @media (max-width: $lg) {
      margin-inline: -30px;
      padding-inline: 30px;
      overflow-x: auto;
      gap: 20px;
      margin-bottom: 25px;
      margin-top: 30px;

      -ms-overflow-style: none; /* Internet Explorer 10+ */
      scrollbar-width: none; /* Firefox */

      &::-webkit-scrollbar {
        display: none; /* Safari and Chrome */
      }
    }
  }

  .tabs button {
    background: none;
    border: none;
    padding: 4px 0;
    cursor: pointer;
    color: var(--gray-400);
    font-size: 16px;
    font-weight: 400;
    border-bottom: 2px solid transparent;
    transition: border-color 0.2s ease-out;
  }

  .tabs button:hover {
    border-color: var(--gray-300);
  }

  .tabs button.active {
    color: var(--secondary);
    border-color: currentColor;
  }

  .tab-content {
    display: flex;
    flex-direction: column;
    gap: 30px;

    > .button {
      align-items: flex-start;
    }
    .card {
      padding: 20px;
      background-color: #fff;
      border-radius: var(--border-radius-big, 10px);
      border: 1px solid var(--border);

      button.button:not(.basic) {
        margin-top: 15px;
      }

      .form {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px 15px;
        input[type="text"],
        input[type="password"],
        input[type="email"] {
          margin: 0;
          width: unset;
          flex-grow: 1;
        }
        button.button:not(.basic) {
          margin-top: 0;
        }
      }
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }

  th,
  td {
    // border: 1px solid #ddd;
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

  .manage_vars {
    list-style-type: none;
    padding-left: 0;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    gap: 5px;
    width: 100%;
    li {
      display: flex;
      flex-direction: row;
      gap: 10px 12px;
      align-items: center;
      flex-grow: 1;
      width: 100%;
      padding: 15px;
      border-radius: 5px;
      flex-wrap: wrap;
      &:nth-child(even) {
        background-color: var(--gray-100);
      }
      &:hover {
        background-color: var(--gray-200);
      }
      label {
        flex-grow: 1;
      }
      button {
        margin-right: 5px;
      }
    }
  }

  h1 {
    text-align: center;
    margin-bottom: 20px;
  }

  input[type="text"],
  input[type="password"],
  input[type="email"] {
    width: 100%;
    padding: 8px;
    margin: 5px 0;
  }

  /* button {
    padding: 8px 16px;
    margin: 5px 0;
    cursor: pointer;
  } */

  .invite-to-workspace p {
    margin-top: 10px;
  }

  .input_wrapper {
    display: flex;

    input:not(:is([type="checkbox"], [type="radio"])) {
      padding: 22px 15px 6px;
      margin: 0;
      + span {
        left: 16px;
      }
    }
  }
</style>
