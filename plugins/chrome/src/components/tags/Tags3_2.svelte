<script>
import { tags } from './stores.js';
import Tags33 from './Tags3_3.svelte';

export let items;
export let key;

</script>

{#each Object.keys(items) as item}
  <div class="space2">typ:{item}</div>
  <Tags33 items={items[item]}/>
{/each}

<style>
.space2 {
  padding-left: 20px;
}
</style>
