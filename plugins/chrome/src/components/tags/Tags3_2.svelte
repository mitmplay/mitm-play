<script>
import { tags } from './stores.js';
import Tags33 from './Tags3_3.svelte';

export let items;
export let key;

</script>

{#each Object.keys(items).filter(x=>x[0]!==':') as item}
  <div class="space2">typ:{item}{items[`:${item}`]}</div>
  <Tags33 items={items[item]}/>
{/each}

<style>
.space2 {
  padding-left: 20px;
  font-weight: bolder;
  color: green;
}
</style>
