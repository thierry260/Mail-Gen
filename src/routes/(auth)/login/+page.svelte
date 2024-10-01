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
  import toast from "svelte-french-toast";

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
        toast.error("Onbekende workspace", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      toast.error(error.message, {
        position: "bottom-right",
      });
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

      // Fetch the user document
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      // Check if the user exists and belongs to the specified workspace
      if (userDoc.exists() && userDoc.data().workspaces.includes(workspace)) {
        // Set the workspace in localStorage
        localStorage.setItem("workspace", workspace);

        // Check the workspace document for the user's subscription info
        const workspaceRef = doc(db, "workspaces", workspace);
        const workspaceDoc = await getDoc(workspaceRef);

        if (workspaceDoc.exists()) {
          const workspaceData = workspaceDoc.data();

          // Check if the user is in the workspace's users map
          if (workspaceData.users && workspaceData.users[user.uid]) {
            const userWorkspaceData = workspaceData.users[user.uid];

            // Set the stripeCustomerId in localStorage if it exists
            if (userWorkspaceData.stripeCustomerId) {
              localStorage.setItem(
                "stripeCustomerId",
                userWorkspaceData.stripeCustomerId
              );
            }
          }
        }

        // Redirect the user after a successful login
        goto("/");
      } else {
        toast.error("Geen toegang tot workspace", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      toast.error("Inloggevens incorrect", {
        position: "bottom-right",
      });
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
        toast.success("Reset link verstuurd", {
          position: "bottom-right",
        });
      } catch (error) {
        toast.error("Er is iets fout gegaan. Controleer het e-mailadres.", {
          position: "bottom-right",
        });
      }
    } else {
      resetMessage.set("Wachtwoord reset geannuleerd.");
    }
  }
</script>

{#if step === 1}
  <form on:submit|preventDefault={checkWorkspace}>
    <div class="heading">
      <figure class="logo_outer">
        <img class="logo" src="/img/MailGen-icon.svg" alt="MailGen logo" />
      </figure>
      <h2>Welkom terug!</h2>
    </div>
    <div class="form_intro">
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
    <div class="heading">
      <figure class="logo_outer">
        <img class="logo" src="/img/MailGen-icon.svg" alt="MailGen logo" />
      </figure>
      <h2>Je bent er bijna</h2>
    </div>
    <div class="form_intro">
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
  .heading {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
    h2 {
      margin-bottom: 0;
    }
  }
  .logo_outer {
    display: flex;
    border-radius: var(--border-radius-big, 10px);
    background-color: var(--primary);
    background: linear-gradient(
      -45deg,
      hsl(from var(--primary) h s calc(l - 10)),
      hsl(from var(--primary) h s calc(l + 8))
    );
    background: var(--primary);
    width: max-content;
    padding: 12px;

    .logo {
      max-width: 32px;
      aspect-ratio: 1;
      object-fit: contain;
      width: 100%;
      display: block;
      filter: brightness(0.1);
      opacity: 0.85;
    }

    @media (max-width: $lg) {
      display: flex;
    }
  }
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
