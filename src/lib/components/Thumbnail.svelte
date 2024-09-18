<script>
  import { CaretRight } from "phosphor-svelte";

  export let type = "template";
  export let id = null;
  export let name = null;
</script>

<a href="/{type}/{id}" class="thumbnail" data-type={type}>
  <h3>{name}</h3>
  <CaretRight size={14} />
</a>

<style lang="scss">
  .thumbnail {
    padding: 15px;
    border-radius: var(--border-radius-small, 5px);
    border: 1px solid var(--border);
    background-color: #fff;
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    text-decoration: none;
    transition:
      background-color 0.2s ease-out,
      border-color 0.2s ease-out;
    &:hover {
      // background-color: var(--gray-100);
      border-color: var(--gray-400);
    }
    &:active {
      color: inherit;
    }
    h3 {
      font-size: 1.6rem;
      flex-grow: 1;
      margin-bottom: 0;
    }
  }
</style>
