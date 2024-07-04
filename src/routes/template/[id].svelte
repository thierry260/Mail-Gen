<script>
  // Import necessary modules or define your logic here
  import { onMount } from "svelte";

  // Access the template ID from the URL parameter
  export let id;

  // Fetch data or perform any necessary actions when the component mounts
  onMount(() => {
    // Example: Fetch template details based on templateId
    // Replace this with your actual data fetching logic
    console.log("Fetching template details for template ID:", id);
  });
</script>

<h1>Template Details</h1>
<p>Template ID: {id}</p>
