<script>
  import { serialize } from "cookie";
  import { user } from "$lib/stores/user"; // assuming user is stored here
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import { X } from "phosphor-svelte";
  import toast from "svelte-french-toast";

  export let visible = false;
  export let closeModal;

  let dialogRef;

  let name = "";
  let email = "";
  let messageType = "Ik heb een vraag"; // default selection
  let message = "";

  // Prefill user data
  onMount(() => {
    const currentUser = $user;
    if (currentUser) {
      name = currentUser.displayName || "";
      email = currentUser.email || "";
    }

    // Show or hide dialog based on the visible prop
    if (visible && dialogRef) {
      dialogRef.showModal();
    } else if (dialogRef) {
      dialogRef.close();
    }
  });

  $: if (visible && dialogRef) {
    dialogRef.showModal();
  } else if (dialogRef) {
    dialogRef.close();
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, messageType, message }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Email succesvol verzonden!", {
          position: "bottom-right",
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to send email.", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("An error occurred while sending the email.", {
        position: "bottom-right",
      });
    }

    closeModal();
  };

  const closeDialog = () => {
    dialogRef.close();
    closeModal();
  };
</script>

<dialog bind:this={dialogRef} on:close={closeDialog}>
  <header>
    <h2>Hulp nodig?</h2>
    <button class="close button basic" on:click={closeDialog}
      ><div class="flex"><X size={16} /></div></button
    >
  </header>
  <p>Vul onderstaand formulier in en we nemen spoedig contact met je op.</p>
  <form on:submit|preventDefault={handleSubmit}>
    <label class="input_wrapper">
      <input
        type="text"
        id="name"
        bind:value={name}
        placeholder="&nbsp;"
        required
      />
      <span>Naam</span>
    </label>

    <label class="input_wrapper">
      <input
        type="email"
        id="email"
        bind:value={email}
        placeholder="&nbsp;"
        required
      />
      <span>E-mailadres</span>
    </label>

    <label class="label">Reden voor contact</label>
    <label class="input_wrapper">
      <select id="messageType" bind:value={messageType}>
        <option>Ik heb een vraag</option>
        <option>Ik heb feedback</option>
        <option>Ik wil een probleem melden</option>
      </select>
    </label>

    <label class="input_wrapper">
      <textarea
        id="message"
        bind:value={message}
        rows="6"
        placeholder="&nbsp;"
        required
      ></textarea>
      <span>Bericht</span>
    </label>

    <div class="actions">
      <button type="button" class="button basic has_text" on:click={closeDialog}
        >Annuleren</button
      >
      <button type="submit" class="button">Verzenden</button>
    </div>
  </form>
</dialog>

<style lang="scss">
  dialog {
    background: #fff;
    border: none;
    padding: 30px;
    border-radius: var(--border-radius);
    width: calc(100% - 60px);
    max-width: 600px;
    flex-direction: column;
    gap: 15px;
    transform: translateY(20px);
    opacity: 0;
    transition:
      transform 0.3s ease-out,
      opacity 0.3s ease-out;

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      * {
        margin-bottom: 0;
      }

      .close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
      }
    }
    p {
      font-size: 1.4rem;
      margin-bottom: 15px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 15px;
      .label {
        margin-block: 10px 0;
        font-weight: 500;
      }
      .input_wrapper {
        display: flex;
      }
      select:has(option[disabled][selected]) {
        color: red !important;
      }
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 15px;
    }

    &::backdrop {
      transition: background-color 0.2s ease-out;
      background: rgba(0, 0, 0, 0);

      animation: backdrop-fade 0.2s ease backwards;
      animation-direction: reverse;
    }

    &[open] {
      display: flex;
      transform: translate(0);
      pointer-events: unset;
      opacity: 1;
      animation: scale-dialog 0.2s ease forwards;
      &::backdrop {
        animation: backdrop-fade 0.2s ease forwards;
      }
    }
  }

  @keyframes scale-dialog {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes backdrop-fade {
    from {
      background: rgba(0, 0, 0, 0);
    }
    to {
      background: rgba(0, 0, 0, 0.3);
    }
  }
</style>
