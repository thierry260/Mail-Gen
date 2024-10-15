<script>
  export let template;

  const renameTemplate = () => {
    const newName = prompt("Rename Template", template.name);
    if (newName) {
      template.name = newName;
    }
  };

  const deleteTemplate = () => {
    if (confirm(`Are you sure you want to delete ${template.name}?`)) {
      // Handle template deletion logic
    }
  };
</script>

<div class="template">
  <span>{template.name}</span>
  <button on:click={renameTemplate}>Rename</button>
  <button on:click={deleteTemplate}>Delete</button>
</div>
