<script>
  import { auth, db } from "$lib/firebase";
  import { signInWithEmailAndPassword } from "firebase/auth";
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
      // errorMessage.set(error.message);
      errorMessage.set("De inloggegevens zijn incorrect.");
    }
  }
</script>

{#if step === 1}
  <form on:submit|preventDefault={checkWorkspace}>
    <h1>Welkom terug!</h1>
    <p>Vul je bedrijfsnaam in om toegang te krijgen tot het inlogformulier.</p>
    <div class="input_wrapper">
      <label class="label" for="workspace">Workspace</label>
      <input type="text" id="workspace" bind:value={workspace} required />
    </div>
    <button class="button" type="submit">Door naar inloggen</button>
    {#if $workspaceErrorMessage}
      <p style="color: red">{$workspaceErrorMessage}</p>
    {/if}
  </form>
{:else}
  <form on:submit|preventDefault={login}>
    <h1>Je bent er bijna</h1>
    <p>Vul je gegevens in om in te loggen.</p>
    <div class="input_wrapper">
      <label class="label" for="email">Email</label>
      <input type="email" id="email" bind:value={email} required />
    </div>
    <div class="input_wrapper">
      <label class="label" for="password">Password</label>
      <input type="password" id="password" bind:value={password} required />
    </div>
    <button class="button" type="submit">Login</button>
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
    .label {
      margin-bottom: 0;
    }
  }
  .back_button.back_button {
    font-size: 1.4rem;
    font-weight: 400;
  }
</style>
