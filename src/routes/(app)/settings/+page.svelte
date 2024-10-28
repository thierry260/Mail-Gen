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
  import { goto } from "$app/navigation";
  import { TrashSimple } from "phosphor-svelte";
  import { loadStripe } from "@stripe/stripe-js";
  import Header from "$lib/components/header/Header.svelte";
  import { user } from "$lib/stores/user";
  import toast from "svelte-french-toast";
  import Managetemplates from "./ManageTemplates.svelte";

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
  let successMessage = "";
  let hasActiveSubscription = false;
  let subscriptionDaysLeft = 0;
  let subscriptionIsTrial = false;
  let currentUser;

  // Handle URL query parameters on page load
  $: if ($page.url.searchParams.get("tab")) {
    const urlTab = $page.url.searchParams.get("tab");
    if (urlTab) {
      activeTab = urlTab; // Set activeTab based on URL param
    }
  }

  $: {
    currentUser = $user;
    if (currentUser && currentUser.subscriptionActive === true) {
      hasActiveSubscription = true;
      subscriptionDaysLeft = currentUser.subscriptionDaysLeft;
      subscriptionIsTrial = currentUser.subscriptionIsTrial;
      console.log("Reactivestatement true");
    }
  }

  // Function to handle tab click and update URL
  const setActiveTab = (tab) => {
    activeTab = tab;
    goto(`/settings?tab=${tab}`); // Update the URL with the active tab
  };

  function copyToClipboard() {
    navigator.clipboard
      .writeText($inviteLink)
      .then(() => {
        console.log("Invite link copied to clipboard!");

        toast.success("Uitnodigingslink gekopieerd", {
          position: "bottom-right",
        });
        // Optionally, you can show a message to the user here
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  }

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
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

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

      toast.success("Variabele toegevoegd", {
        position: "bottom-right",
      });
    }
  };

  const updateVariable = (id, field, value) => {
    workspaceVariables[id][field] = value;
    saveVariables();
  };

  const removeVariable = (id) => {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    if (confirm("Weet je zeker dat je deze variabele wilt verwijderen?")) {
      delete workspaceVariables[id];
      workspaceVariables = workspaceVariables;
      saveVariables();

      toast.success("Variabele verwijderd", {
        position: "bottom-right",
      });
    }
  };

  // Function to handle password change
  const handleChangePassword = async () => {
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      toast.success("Wachtwoord aangepast", {
        position: "bottom-right",
      });
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        toast.error("Onjuist wachtwoord", {
          position: "bottom-right",
        });
      } else {
        toast.error(error.message, {
          position: "bottom-right",
        });
      }
    }
  };

  // Function to handle workspace name change
  const handleChangeWorkspaceName = async () => {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    try {
      const workspaceId = localStorage.getItem("workspace");
      if (!workspaceId) {
        throw new Error("Workspace ID not found in localStorage");
      }

      const docRef = doc(db, "workspaces", workspaceId);
      await updateDoc(docRef, { name: workspaceName });
      toast.success("Workspacenaam aangepast.", {
        position: "bottom-right",
      });
    } catch (error) {
      toast.error(error.message, {
        position: "bottom-right",
      });
    }
  };

  // Function to generate invite link
  const generateInviteLink = async () => {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    try {
      const workspaceId = localStorage.getItem("workspace");
      if (!workspaceId) {
        throw new Error("Workspace ID not found in localStorage");
      }

      const inviteId = btoa(`${workspaceId},${inviteEmail}`);
      const link = `${window.location.origin}/get-mailgen?id=${inviteId}`;
      inviteLink.set(link);

      copyToClipboard();
    } catch (error) {
      toast.error(error.message, {
        position: "bottom-right",
      });
    }
  };

  const cancelSubscription = async () => {
    // Confirm the user really wants to cancel
    if (!confirm("Weet je zeker dat je je abonnement wilt annuleren?")) return;

    // Get the customer ID from localStorage
    const customerId = localStorage.getItem("stripeCustomerId");

    // If no customer ID is found, show an error
    if (!customerId) {
      toast.error("Klant-ID niet gevonden", {
        position: "bottom-right",
      });
      return;
    }

    try {
      const workspaceId = localStorage.getItem("workspace");
      const userId = auth.currentUser.uid;

      // Make the API call to cancel the subscription
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: workspaceId,
          userId: userId,
          customerId: customerId,
        }),
      });

      const data = await response.json();

      // Handle the success case
      if (data.success) {
        successMessage = data.message;

        // Update the user state after cancellation
        user.update((currentUser) => {
          return {
            ...currentUser,
            subscriptionActive: false,
            subscriptionDaysLeft: 0, // Set to 0 since the subscription is now canceled
          };
        });

        // Remove the customer ID from localStorage
        localStorage.removeItem("stripeCustomerId");

        // Show a success toast message
        toast.success("Abonnement succesvol geannuleerd.", {
          position: "bottom-right",
        });
      } else {
        throw new Error(data.error || "Failed to cancel subscription");
      }
    } catch (err) {
      // Handle errors and show error messages
      errorMessage = err.message;
      toast.error(errorMessage, {
        position: "bottom-right",
      });
    }
  };

  onMount(async () => {
    if (!browser) return;
    setTimeout(() => {
      // // Get the 'cid' parameter from the URL
      // const stripeCustomerId = $page.url.searchParams.get("cid");

      // // If 'cid' is present in the URL, set it to localStorage
      // if (stripeCustomerId) {
      //   localStorage.setItem("stripeCustomerId", stripeCustomerId);
      //   console.log(`stripeCustomerId set to ${stripeCustomerId}`);
      // }

      const urlTab = $page.url.searchParams.get("tab");
      if (urlTab) {
        activeTab = urlTab;
      }

      fetchVariables();
    }, 100); // Adding a delay to ensure all elements are ready before processing URL parameters.
  });

  const subscribe = async () => {
    try {
      const workspaceId = localStorage.getItem("workspace");
      const userId = auth.currentUser.uid;

      const response = await fetch(
        `${window.location.origin}/api/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId: "price_1Q2td6CfSGPTfKftLJ5CLqAe",
            email: auth.currentUser.email,
            workspaceId: workspaceId,
            userId: userId,
          }),
        }
      );

      const data = await response.json();
      console.log("API response: ", data);

      if (data.sessionId) {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (error) {
          errorMessage = error.message;
        }
      } else {
        throw new Error("SessionId missing in API response");
      }
    } catch (err) {
      console.error("Error in subscribe function: ", err.message);
      errorMessage = err.message;
    }
  };
</script>

<Header type={"settings"} />

<!-- Tab Navigation -->
<div class="tabs">
  <button
    class:active={activeTab === "variables"}
    on:click={() => setActiveTab("variables")}>Variabelen</button
  >
  <button
    class:active={activeTab === "templates"}
    on:click={() => setActiveTab("templates")}>Templates</button
  >
  <button
    class:active={activeTab === "account"}
    on:click={() => setActiveTab("account")}>Account</button
  >
  <button
    class:active={activeTab === "workspace"}
    on:click={() => setActiveTab("workspace")}>Workspace</button
  >
  <button
    class:active={activeTab === "subscription"}
    on:click={() => setActiveTab("subscription")}>Abonnement</button
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
{:else if activeTab === "templates"}
  <Managetemplates />
{:else if activeTab === "account"}
  <div class="tab-content">
    <div class="card">
      <h4>Wachtwoord wijzigen</h4>
      <form>
        <input
          type="password"
          placeholder="Huidig wachtwoord"
          name="current_password"
          bind:value={currentPassword}
        />
        <input
          type="password"
          placeholder="Nieuw wachtwoord"
          name="new_password"
          bind:value={newPassword}
        />
      </form>
      <button type="button" class="button" on:click={handleChangePassword}
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
        <p
          class="invite_link"
          data-tooltip="Klik om te kopiëren"
          data-flow="top"
          on:click={copyToClipboard}
        >
          Uitnodigingslink: <a href={$inviteLink} target="_blank"
            >{$inviteLink}</a
          >
        </p>
      {/if}
    </div>
  </div>
{:else if activeTab === "subscription"}
  <div class="tab-content">
    {#if hasActiveSubscription}
      <div class="card">
        <h2>Abonnement</h2>
        {#if subscriptionIsTrial}
          <p>Je proefperiode is nog {subscriptionDaysLeft} dagen geldig.</p>
        {:else}
          <p class="mb-20">
            Je abonnement is nog {subscriptionDaysLeft} dagen geldig.
          </p>
          <button class="button basic has_text" on:click={cancelSubscription}>
            Abonnement annuleren
          </button>
        {/if}
      </div>
    {/if}

    {#if subscriptionIsTrial || !hasActiveSubscription}
      <div class="card">
        <h2>Abonneer je nu</h2>
        <div class="subscription_info">
          <div>
            <p>
              Bespaar tijd en optimaliseer je klantcontact met onze
              gebruiksvriendelijke tool voor het maken en hergebruiken van
              professionele e-mailtemplates.
            </p>
            <br />
            <p>
              Personaliseer eenvoudig je berichten met variabelen en houd je
              communicatie altijd consistent. MailGen helpt je om snel en
              foutloos te werken, zodat jij je kunt concentreren op wat echt
              belangrijk is.
            </p>
          </div>
          <ul class="subscription_list">
            <li>Bespaar kostbare tijd</li>
            <li>Structureer je klantcontact</li>
            <li>Houd je communicatie consistent</li>
            <li>Verbeter je productiviteit</li>
            <li>Verminder handmatige fouten</li>
          </ul>
        </div>
        <div class="subscription_action">
          <button class="button" on:click={subscribe}
            >Abonnement aanschaffen</button
          >
          <small
            ><i>€20,- per maand</i><i>Maandelijks opzegbaar</i><i
              >Geen minimale looptijd</i
            ></small
          >
        </div>
      </div>
    {/if}

    {#if errorMessage}
      <p style="color: red;">{errorMessage}</p>
    {/if}
    {#if successMessage}
      <p style="color: green;">{successMessage}</p>
    {/if}
  </div>
{/if}

<style lang="scss">
  .subscription_info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    margin-bottom: 40px;
  }
  .subscription_list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 15px;

    li {
      display: flex;
      align-items: center;
      font-size: 1.5rem;

      &::before {
        content: "";
        display: inline-block;
        width: 24px;
        height: 24px;
        background-color: var(--primary);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='https://www.w3.org/2000/svg' width='16' height='16' fill='%23000000' viewBox='0 0 256 256'%3E%3Cpath d='M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z'%3E%3C/path%3E%3C/svg%3E");
        background-position: center;
        background-repeat: no-repeat;
        background-size: 12px;
        border-radius: 50%;
        margin-right: 0.75rem;
      }
    }
  }
  .subscription_action {
    display: flex;
    flex-direction: column;
    gap: 10px;
    small {
      font-size: 1.3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 5px;
      opacity: 0.6;
      text-align: center;
      i {
        &:not(:last-child)::after {
          content: " • ";
          opacity: 0.3;
          @media (max-width: $md) {
            display: none;
          }
        }
      }
    }
  }

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

      .invite_link {
        margin-top: 15px;
        text-align: center;
        background-color: var(--gray-100);
        border-radius: 5px;
        padding: 5px;
        font-size: 1.4rem;
        color: var(--gray-500);
        a {
          color: var(--gray-800);
        }
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
