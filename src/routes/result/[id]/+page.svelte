<script>
  console.log("line 2");
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  
  let generatedContent = '';
  let userInput = {};
  let userName = '';
  let userEmail = '';
  let cc = '';
  let bcc = '';

  // Get the state passed from the previous page
  $: if (page?.state) {
    generatedContent = page.state.generatedContent;
    userInput = page.state.userInput;
  }

  console.log('HALLO?');

  // Handle the send button click
  const sendEmail = () => {
    console.log({
      name: userName,
      email: userEmail,
      cc: cc,
      bcc: bcc,
      content: generatedContent,
    });
  };
</script>

<h1>Send Email</h1>
<div class="email-details">
  <div>
    <label for="userName">Name</label>
    <input type="text" id="userName" bind:value={userName} placeholder="Your Name" />
  </div>
  <div>
    <label for="userEmail">Email</label>
    <input type="email" id="userEmail" bind:value={userEmail} placeholder="Your Email" />
  </div>
  <div>
    <label for="cc">CC</label>
    <input type="email" id="cc" bind:value={cc} placeholder="CC" />
  </div>
  <div>
    <label for="bcc">BCC</label>
    <input type="email" id="bcc" bind:value={bcc} placeholder="BCC" />
  </div>
</div>
<div class="preview">
  <h2>Generated Email Content</h2>
  <div class="preview-content" {@html generatedContent}></div>
</div>
<button on:click={sendEmail}>Send</button>

<style lang="scss">
  .email-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    > div {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
  }
  .preview {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 30px;
    margin-bottom: 20px;
    h2 {
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5em;
    }
    .preview-content {
      line-height: 1.5;
    }
  }
  button {
    padding: 10px 20px;
    background-color: var(--button-background);
    color: var(--button-color);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    &:hover {
      background-color: var(--button-hover-background);
    }
  }
</style>