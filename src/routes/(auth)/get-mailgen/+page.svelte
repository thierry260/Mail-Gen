<script>
  import { auth, db } from "$lib/firebase";
  import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
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
  import { tick } from "svelte";
  import { user } from "$lib/stores/user";

  let workspaceId = "";
  let workspaceInput = false;
  let workspaceName = "";
  let email = "";
  let password = "";
  let firstName = "";
  let lastName = "";
  let errorMessage = writable("");
  let isInvited = false;

  let currentUser;
  $: {
    currentUser = $user;
    console.log("currentUser", currentUser);
  }

  $: if ($page.url.searchParams.has("email")) {
    email = $page.url.searchParams.get("email");
  }

  $: if ($page.url.searchParams.has("id")) {
    const workspaceReferral = atob($page.url.searchParams.get("id")).split(",");
    workspaceId = workspaceReferral[0];
    email = workspaceReferral[1]; // Correctly assigning email
    isInvited = true;

    // Fetch the workspace name based on the workspaceId
    (async () => {
      const workspaceRef = doc(db, "workspaces", workspaceId);
      const workspaceDoc = await getDoc(workspaceRef);
      if (workspaceDoc.exists()) {
        workspaceName = workspaceDoc.data().name;
      } else {
        workspaceName = "Unknown Workspace";
      }
    })();
  }

  $: if (workspaceInput) {
    tick().then(() => {
      workspaceInput.focus(); // Focus the input after the DOM updates
    });
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
              "Het maximale aantal gebruikers voor deze workspace is bereikt"
            );
            return;
          }

          // If the user is logged in, skip account creation
          if (currentUser) {
            await addLoggedInUserToWorkspace(workspaceRef);
          } else {
            await createAndRegisterUser(workspaceRef);
          }
        } else {
          errorMessage.set(
            "Workspace bestaat niet. Controleer de uitnodigingslink."
          );
        }
      } else {
        if (!workspaceDoc.exists()) {
          const variables = {};
          variables[
            Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
          ] = { field_name: "Voornaam", placeholder: "Voornaam" };
          variables[
            Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
          ] = { field_name: "Afzender", placeholder: "Afzender" };

          const categories = [
            {
              id: "zcayp0fb",
              name: "Algemeen",
              sub: [],
              templates: [
                {
                  id: "j63CPPKaTlOnPxxooJvu",
                  name: "Welkom bij MailGen",
                  lastUpdated: new Date(),
                },
              ],
            },
          ];

          await setDoc(workspaceRef, {
            name: workspaceName,
            admin_uids: [],
            is_trial: true,
            created_at: Timestamp.fromDate(new Date()),
            variables,
            categories,
          });

          // Create a document in the templates collection with the specified ID and fields
          const templateRef = doc(
            workspaceRef,
            "templates",
            "j63CPPKaTlOnPxxooJvu"
          );
          await setDoc(templateRef, {
            name: "Welkom bij MailGen",
            content: {
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "Beste " },
                    {
                      type: "variable",
                      attrs: {
                        id: Object.keys(variables)[0],
                        placeholder: "Voornaam",
                        variable: "Voornaam",
                      },
                    },
                    { type: "text", text: "," },
                  ],
                },
                { type: "paragraph" },
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Leuk dat je gebruik maakt van Mail Gen!",
                    },
                  ],
                },
                { type: "paragraph" },
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Met vriendelijke groet," }],
                },
                { type: "paragraph" },
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "variable",
                      attrs: {
                        id: Object.keys(variables)[1],
                        placeholder: "Afzender",
                        variable: "Afzender",
                      },
                    },
                  ],
                },
              ],
              type: "doc",
            },
            variables: {},
          });

          // Send event to Facebook Conversions API after successful registration
          await sendFacebookConversionEvent();
        } else {
          workspaceName = workspaceDoc.data().name;
        }

        await createAndRegisterUser(workspaceRef);
      }
    } catch (error) {
      errorMessage.set(error.message);
    }
  }

  async function sendFacebookConversionEvent() {
    // Facebook API details
    const pixelId = "579307274634676";
    const accessToken =
      "EAAMupE49C7wBOZBNDTowDaMfQU6K0ICMeOQKDB5HFOWSPDqStqvpXQrXz1IugnhL8Vfs18DCFutE2QdNwHzURvOTqxBx8lsCEESpZCByUuJBitN5ZCsZAP1880iXkoVwt9WyaTVkex8zB20uzFzZCXDXbbtqhZCWzOFYcWiudTPTlUqZAudp5XVUL8lKYaRwLHjHQZDZD";
    const apiVersion = "v21.0";
    const url = `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${accessToken}`;

    try {
      // Validate and hash the email (mandatory)
      const sanitizedEmail = email?.toLowerCase().trim();
      if (!sanitizedEmail) {
        console.warn(
          "Email is required to send the Facebook conversion event."
        );
        return;
      }
      const hashedEmail = await sha256Hash(sanitizedEmail);

      // Optional fields: first name and last name
      const hashedFirstName = firstName
        ? await sha256Hash(firstName.toLowerCase().trim())
        : undefined;
      const hashedLastName = lastName
        ? await sha256Hash(lastName.toLowerCase().trim())
        : undefined;

      // Prepare user data with email and optional names if available
      const clientUserAgent = navigator?.userAgent || "unknown";
      const userData = {
        em: hashedEmail,
        client_user_agent: clientUserAgent,
        ...(hashedFirstName && { fn: hashedFirstName }),
        ...(hashedLastName && { ln: hashedLastName }),
      };

      // Prepare event payload
      const eventPayload = {
        data: [
          {
            action_source: "website",
            event_name: "Free trial started",
            event_time: Math.floor(Date.now() / 1000),
            user_data: userData,
          },
        ],
        test_event_code: "TEST42964", // Optional test code
      };

      // Send event to Facebook
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      });

      // Handle response
      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Error sending Facebook event:", errorMessage);
      } else {
        const responseBody = await response.json();
        console.log("Facebook event sent successfully:", responseBody);
      }
    } catch (error) {
      console.error("Error in Facebook conversion event function:", error);
    }
  }

  async function sha256Hash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function addLoggedInUserToWorkspace() {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentWorkspaces = Array.isArray(userData.workspaces)
          ? userData.workspaces
          : [];

        // Check if user already has access to the workspace
        if (!currentWorkspaces.includes(workspaceId)) {
          // Add workspaceId to the user's workspaces array
          await setDoc(
            userDocRef,
            { workspaces: [...currentWorkspaces, workspaceId] },
            { merge: true }
          );

          // Extract first and last name from displayName, if available
          let firstName, lastName;
          if (currentUser.displayName) {
            [firstName, ...lastName] = currentUser.displayName.split(" ");
            lastName = lastName.join(" ") || null;
          }

          // Create a user object for the workspace document, omitting undefined fields
          const userObject = {
            email: currentUser.email,
            role: "user",
            ...(firstName && { first_name: firstName }),
            ...(lastName && { last_name: lastName }),
          };

          // Add user to the invited workspace’s `users` subcollection
          const usersRef = collection(db, "workspaces", workspaceId, "users");
          await setDoc(doc(usersRef, currentUser.uid), userObject);

          localStorage.setItem("workspace", workspaceId);
          localStorage.removeItem("recentlyViewed");
          localStorage.removeItem("cachedWorkspaceData");
          localStorage.removeItem("cachedWorkspaceDataExpiration");

          goto("/");
        } else {
          errorMessage.set("Je hebt al toegang tot deze workspace");
        }
      } else {
        errorMessage.set("Gebruikersgegevens niet gevonden");
      }
    } catch (error) {
      errorMessage.set(
        `Het is niet gelukt om een ​​gebruiker toe te voegen aan workspace: ${error.message}`
      );
    }
  }

  async function createAndRegisterUser() {
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
  <div class="heading">
    <figure class="logo_outer">
      <img class="logo" src="/img/MailGen-icon.svg" alt="MailGen logo" />
    </figure>
    <h2>
      {isInvited ? `Join workspace: ${workspaceName}` : "Maak een workspace"}
    </h2>
  </div>

  {#if !isInvited}
    <label class="input_wrapper">
      <input
        placeholder="&nbsp;"
        type="text"
        id="workspaceName"
        bind:this={workspaceInput}
        bind:value={workspaceName}
        required
      />
      <span>Bedrijfsnaam</span>
    </label>
  {/if}

  {#if !currentUser}
    <div class="input_columns" data-columns="2">
      <label class="input_wrapper">
        <input
          placeholder="&nbsp;"
          type="text"
          id="firstName"
          bind:value={firstName}
          required
        />
        <span>Voornaam</span>
      </label>
      <label class="input_wrapper">
        <input
          placeholder="&nbsp;"
          type="text"
          id="lastName"
          bind:value={lastName}
          required
        />
        <span>Achternaam</span>
      </label>
    </div>
  {/if}
  <label class="input_wrapper">
    {#if isInvited}
      <input
        placeholder="&nbsp;"
        type="email"
        id="email"
        bind:value={email}
        required
        readonly
      />
    {:else}
      <input
        placeholder="&nbsp;"
        type="email"
        id="email"
        bind:value={email}
        required
      />
    {/if}
    <span>E-mailadres</span>
  </label>
  {#if !currentUser}
    <label class="input_wrapper">
      <input
        placeholder="&nbsp;"
        type="password"
        id="password"
        bind:value={password}
        required
      />
      <span>Wachtwoord</span>
    </label>
  {/if}
  <button class="button" type="submit">
    {isInvited ? `Join ${workspaceName}` : "Workspace aanmaken"}
  </button>
  {#if !currentUser && !isInvited}
    <p class="form_note">
      <small>Heb je al een workspace? </small><a href="/login">Inloggen</a>
    </p>
  {/if}
  {#if $errorMessage}
    <p style="color: red">{$errorMessage}</p>
  {/if}
</form>

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
    input[readonly][readonly] {
      background-color: var(--gray-200);
      cursor: not-allowed;
    }
  }
</style>
