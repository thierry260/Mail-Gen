<script>
  import { onMount } from "svelte";
  import db from "../firebase";
  import { doc, getDoc } from "firebase/firestore";
  import AccordionItem from "./AccordionItem.svelte";

  let data = [];

  onMount(async () => {
    const docRef = doc(db, "workspaces", "wms"); // Replace with your collection and document
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      data = docSnap.data().categories.map(category => ({
        ...category,
        open: false // Add open property to handle accordion state
      }));
    } else {
      console.log("Document not found");
    }
  });
</script>

<div>
  <h1>Data from Firestore:</h1>
  {#each data as item}
    <AccordionItem {item} />
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
