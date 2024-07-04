<!-- src/lib/components/sidebar/Sidebar.svelte -->
<script>
  import { onMount } from "svelte";
  import db from "../../../firebase"; // Adjust the path as necessary
  import { doc, getDoc } from "firebase/firestore";
  import SidebarItem from "./SidebarItem.svelte";

  let data = [];

  onMount(async () => {
    const docRef = doc(db, "workspaces", "wms"); // Replace with your collection and document
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      data = docSnap.data().categories.map((category) => ({
        ...category,
        open: false, // Add open property to handle accordion state
      }));
      console.log(data);
    } else {
      console.log("Document not found");
    }
  });
</script>

<div>
  <h1>Sidebar Menu</h1>
  {#each data as item}
    <SidebarItem {item} />
  {/each}
</div>

<style>
  h1 {
    font-family: sans-serif;
  }
  div {
    font-family: Arial, sans-serif;
  }
</style>
