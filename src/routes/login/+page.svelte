<!-- src/routes/login/+page.svelte -->
<script>
  import { auth } from "$lib/firebase";
  import { signInWithEmailAndPassword } from "firebase/auth";
  import { writable } from "svelte/store";
  import { goto } from "$app/navigation";

  let email = "";
  let password = "";
  let errorMessage = writable("");

  async function login() {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      goto("/");
    } catch (error) {
      errorMessage.set(error.message);
    }
  }
</script>

<main>
  <h1>Login</h1>
  <form on:submit|preventDefault={login}>
    <div>
      <label for="email">Email:</label>
      <input type="email" id="email" bind:value={email} required />
    </div>
    <div>
      <label for="password">Password:</label>
      <input type="password" id="password" bind:value={password} required />
    </div>
    <button type="submit">Login</button>
    {#if $errorMessage}
      <p style="color: red">{$errorMessage}</p>
    {/if}
  </form>
</main>

<style>
  /* Add your styles here */
</style>
