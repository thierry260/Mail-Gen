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

<form on:submit|preventDefault={login}>
  <h1>Login</h1>
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
</form>

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
</style>
