<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { doc, getDoc } from "firebase/firestore";
  import db from "$lib/firebase"; // Use the alias '@' to refer to the 'src' directory

  let id;
  let templateData = {};

  // Subscribe to the page store to get the ID parameter
  $: id = $page.params.id;

  // Fetch the template data from Firestore
  const fetchTemplateData = async (id) => {
    const docRef = doc(db, "workspaces", "wms", "templates", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      templateData = docSnap.data();
      console.log("Template Data:", templateData);
    } else {
      console.log("No such document!");
    }
  };

  // Perform any necessary actions when the component mounts
  onMount(() => {
    console.log("Fetching template details for template ID:", id);
    fetchTemplateData(id);
  });
</script>

<h1>Template Details</h1>
<p>Template ID: {id}</p>
{#if templateData}
  <div>
    <!-- Render the template data -->
    <pre>{JSON.stringify(templateData, null, 2)}</pre>
  </div>
{/if}
