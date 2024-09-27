<script>
  import { auth, db } from "$lib/firebase";
  import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
  } from "firebase/auth";
  import { writable } from "svelte/store";
  import { goto } from "$app/navigation";
  import { doc, getDoc } from "firebase/firestore";
  import { CaretLeft } from "phosphor-svelte";

  let step = 1; // Start with step 1
  let workspace = "";
  let workspaceName = writable("");
  let email = "";
  let password = "";
  let errorMessage = writable("");
  let workspaceErrorMessage = writable("");
  let resetMessage = writable(""); // For password reset feedback

  async function checkWorkspace() {
    try {
      const workspaceId = workspace.trim().toLowerCase().replace(/\s/g, "");
      const workspaceRef = doc(db, "workspaces", workspaceId);
      const workspaceDoc = await getDoc(workspaceRef);

      if (workspaceDoc.exists()) {
        workspaceName.set(workspaceDoc.data().name);
        step = 2;
      } else {
        workspaceErrorMessage.set(
          "Deze workspace is niet bij ons bekend. Probeer het nog een keer."
        );
      }
    } catch (error) {
      workspaceErrorMessage.set(error.message);
    }
  }

  async function login() {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists() && userDoc.data().workspaces.includes(workspace)) {
        localStorage.setItem("workspace", workspace);
        goto("/");
      } else {
        errorMessage.set("Je account is geen onderdeel van deze workspace.");
      }
    } catch (error) {
      errorMessage.set("De inloggegevens zijn incorrect.");
    }
  }

  async function resetPassword() {
    // Prompt user for email with pre-filled value
    const userEmail = window.prompt(
      "Voer je e-mailadres in om je wachtwoord te resetten:",
      email
    );

    // Check if user canceled the prompt or didn't provide an email
    if (userEmail) {
      try {
        await sendPasswordResetEmail(auth, userEmail);
        resetMessage.set(
          "Een wachtwoord reset link is naar je e-mailadres gestuurd."
        );
      } catch (error) {
        resetMessage.set("Er is iets fout gegaan. Controleer het e-mailadres.");
      }
    } else {
      resetMessage.set("Wachtwoord reset geannuleerd.");
    }
  }
</script>

{#if step === 1}
  <form on:submit|preventDefault={checkWorkspace}>
    <div class="form_intro">
      <h1>Welkom terug!</h1>
      <p>
        Vul je bedrijfsnaam in om toegang te krijgen tot het inlogformulier.
      </p>
    </div>
    <label class="input_wrapper">
      <input
        type="text"
        id="workspace"
        bind:value={workspace}
        required
        placeholder="&nbsp;"
      />
      <span>Bedrijfsnaam</span>
    </label>
    <button class="button" type="submit">Door naar inloggen</button>
    <p class="form_note">
      <small>Nieuw met MailGen? </small><a href="/get-mailgen"
        >Maak een workspace aan</a
      >
    </p>
    {#if $workspaceErrorMessage}
      <p style="color: red">{$workspaceErrorMessage}</p>
    {/if}
  </form>
{:else}
  <form on:submit|preventDefault={login}>
    <div class="form_intro">
      <h1>Je bent er bijna</h1>
      <p>Vul je gegevens in om in te loggen.</p>
    </div>
    <label class="input_wrapper">
      <input
        type="email"
        id="email"
        bind:value={email}
        required
        placeholder="&nbsp;"
      />
      <span>E-mailadres</span>
    </label>
    <label class="input_wrapper">
      <input
        type="password"
        id="password"
        bind:value={password}
        required
        placeholder="&nbsp;"
      />
      <span>Wachtwoord</span>
    </label>
    <button class="button" type="submit">Login</button>

    <!-- Forgot password link -->
    <button type="button" class="link-button" on:click={resetPassword}>
      Wachtwoord vergeten?
    </button>

    <!-- Password reset feedback message -->
    {#if $resetMessage}
      <p style="color: green">{$resetMessage}</p>
    {/if}

    {#if $errorMessage}
      <p style="color: red">{$errorMessage}</p>
    {/if}

    <button
      type="button"
      class="button outline back_button"
      on:click={() => (step = 1)}
    >
      <CaretLeft size={16} />
      <span>Workspace: {$workspaceName}</span>
    </button>
  </form>
{/if}

<style lang="scss">
  .form_intro {
    margin-bottom: 30px;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 540px;
    width: 100%;
    margin-inline: auto;
  }
  .input_wrapper {
    display: flex;
    flex-direction: column;
    gap: 5px;
    justify-content: stretch;
  }
  .link-button {
    background: none;
    border: none;
    color: var(--text);
    text-decoration: underline;
    cursor: pointer;
    font-size: 1.4rem;
  }
  .back_button {
    font-size: 1.4rem;
    font-weight: 400;
  }
</style>
