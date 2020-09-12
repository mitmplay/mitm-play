<script>
import { tags } from './stores.js';
import Tags31 from './Tags3_1.svelte'; 
</script>

<td>
{#each Object.keys($tags.__tag3) as item}
  <Tags31 items={$tags.__tag3[item]} key={item}/>
{/each}
</td>

<style>
</style>