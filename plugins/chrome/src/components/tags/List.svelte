<script>
import { list } from './stores.js';
import Item from './Item.svelte';
</script>

{#each $list.routez as route}
  <Item item={{route}}/>
{/each}
