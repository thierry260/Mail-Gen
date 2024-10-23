<!-- UndoToast.svelte -->
<script>
  import { createEventDispatcher } from "svelte";
  import toast_ from "svelte-french-toast";
  import { X } from "phosphor-svelte";

  export let toast;

  const dispatch = createEventDispatcher();

  const handleUndo = () => {
    // Manually trigger a DOM event for undo
    const undoEvent = new CustomEvent("undo-toast", { detail: toast.id });
    document.dispatchEvent(undoEvent); // Dispatch the event globally
    toast_.dismiss(toast.id); // Dismiss the toast when undo is clicked
  };
</script>

<div class="custom_toast">
  <span>Templates aangepast</span>
  <button class="button basic" on:click={handleUndo}>Ongedaan maken</button>
  <!-- <button on:click={() => toast_.dismiss(toast.id)}><X size={14} /></button> -->
</div>

<style lang="scss">
  .custom_toast {
    display: flex;
    align-items: center;
    gap: 10px;
    box-sizing: border-box;
    span {
      white-space: nowrap;
      font-size: 1.4rem;
    }
    .button {
      padding-block: 5px;
    }
  }
</style>
