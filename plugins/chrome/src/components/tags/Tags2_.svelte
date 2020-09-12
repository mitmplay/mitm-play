<script>
import { tags } from './stores.js';
import Tags21 from './Tags2_1.svelte'; 
</script>

<td>
{#each Object.keys($tags.__tag2) as ns}
  <Tags21 items={$tags.__tag2[ns]} ns={ns}/>
{/each}
</td>

<style>
</style>
