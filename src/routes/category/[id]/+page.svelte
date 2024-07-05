<!-- src/routes/category/[id]/+page.svelte -->
<script>
  import Breadcrumbs from "$lib/components/header/Breadcrumbs.svelte";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { doc, getDoc } from "firebase/firestore";
  import db from "$lib/firebase"; // Use the alias '@' to refer to the 'src' directory

  let id;
  $: {
    id = $page.params.id;
  }
</script>

<Breadcrumbs {id} />
