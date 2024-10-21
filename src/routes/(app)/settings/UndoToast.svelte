<!-- UndoToast.svelte -->
<script>
  import toast_ from "svelte-french-toast";
  import { X } from "phosphor-svelte";

  export let toast;
  export let onUndo = () => {}; // Default fallback to avoid errors

  const handleUndo = () => {
    if (typeof onUndo === "function") {
      onUndo(); // Call the passed onUndo function
      toast_.dismiss(toast.id); // Dismiss toast when undo is clicked
    }
  };
</script>

<div class="custom_toast">
  <span>Wijzigingen opgeslagen</span>
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
