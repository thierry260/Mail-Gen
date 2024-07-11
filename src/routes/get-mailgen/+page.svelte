<script>
  import { auth, db } from "$lib/firebase";
  import {
    getAuth,
    createUserWithEmailAndPassword,
    updateProfile,
  } from "firebase/auth";
  import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    Timestamp,
  } from "firebase/firestore";
  import { writable } from "svelte/store";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  let workspaceId = "";
  let workspaceName = "";
  let email = "";
  let password = "";
  let firstName = "";
  let lastName = "";
  let errorMessage = writable("");
  let isInvited = false;

  $: if ($page.url.searchParams.has("id")) {
    const workspaceReferral = atob($page.url.searchParams.get("id")).split(",");
    workspaceId = workspaceReferral[0];
    workspaceName = workspaceReferral[1];
    isInvited = true;
  }

  async function register() {
    try {
      if (!isInvited) {
        workspaceId = workspaceName.trim().toLowerCase().replace(/\s/g, "");
      }

      const workspaceRef = doc(db, "workspaces", workspaceId);
      const workspaceDoc = await getDoc(workspaceRef);

      if (isInvited) {
        if (workspaceDoc.exists()) {
          const usersRef = collection(db, "workspaces", workspaceId, "users");
          const usersSnapshot = await getDocs(usersRef);
          const usersCount = usersSnapshot.size;

          if (usersCount >= parseInt(workspaceDoc.data().usersNo, 10)) {
            errorMessage.set(
              "Maximum number of users reached for this workspace."
            );
            return;
          }

          await createAndRegisterUser(workspaceRef);
        } else {
          errorMessage.set(
            "Workspace does not exist. Please check the invite link."
          );
        }
      } else {
        if (!workspaceDoc.exists()) {
          await setDoc(workspaceRef, {
            name: workspaceName,
            admin_uids: [],
            is_trial: true,
            created_at: Timestamp.fromDate(new Date()),
          });
        } else {
          workspaceName = workspaceDoc.data().name;
        }

        await createAndRegisterUser(workspaceRef);
      }
    } catch (error) {
      errorMessage.set(error.message);
    }
  }

  async function createAndRegisterUser(workspaceRef) {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userUID = user.uid;

      const userData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: "user",
      };

      await setDoc(
        doc(db, "workspaces", workspaceId, "users", userUID),
        userData
      );

      const userCommonData = {
        company_name: workspaceName,
        first_name: firstName,
        last_name: lastName,
        workspaces: [workspaceId],
      };

      await setDoc(doc(db, "users", userUID), userCommonData);

      await updateProfile(user, { displayName: `${firstName} ${lastName}` });

      localStorage.setItem("workspace", workspaceId);
      localStorage.removeItem("recentlyViewed");
      localStorage.removeItem("cachedWorkspaceData");
      localStorage.removeItem("cachedWorkspaceDataExpiration");

      goto("/");
    } catch (error) {
      errorMessage.set(error.message);
    }
  }
</script>

<form on:submit|preventDefault={register}>
  <h1>
    {isInvited ? `Join Workspace: ${workspaceName}` : "Create a Workspace"}
  </h1>
  {#if !isInvited}
    <div class="input_wrapper">
      <label for="workspaceName">Workspace Name</label>
      <input
        type="text"
        id="workspaceName"
        bind:value={workspaceName}
        required
      />
    </div>
  {/if}
  <div class="input_wrapper">
    <label for="firstName">Voornaam</label>
    <input type="text" id="firstName" bind:value={firstName} required />
  </div>
  <div class="input_wrapper">
    <label for="lastName">Achternaam</label>
    <input type="text" id="lastName" bind:value={lastName} required />
  </div>
  <div class="input_wrapper">
    <label for="email">E-mailadres</label>
    <input type="email" id="email" bind:value={email} required />
  </div>
  <div class="input_wrapper">
    <label for="password">Wachtwoord</label>
    <input type="password" id="password" bind:value={password} required />
  </div>
  <button class="button" type="submit">Workspace aanmaken</button>
  {#if $errorMessage}
    <p style="color: red">{$errorMessage}</p>
  {/if}
</form>

<style>
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
  }
</style>
