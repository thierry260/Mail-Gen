<script>
    export let item;
</script>

<div class="accordion-item">
    <div class="accordion-header" on:click={() => (item.open = !item.open)}>
        {item.name}
    </div>
    {#if item.sub && item.open}
        <div class="accordion-content">
            {#each item.sub as subItem}
                <svelte:self item={subItem} />
            {/each}
        </div>
    {/if}
</div>

<style>
    .accordion-item {
        margin-left: 20px;
    }

    .accordion-header {
        cursor: pointer;
        padding: 5px;
        background-color: #eee;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .accordion-content {
        margin-left: 20px;
        border-left: 2px solid #ccc;
        padding-left: 10px;
    }
</style>
