<script>
import { tags } from './stores.js';
import Tags21 from './Tags2_1.svelte';

function oneSite(ns) {
  if ($tags.filterUrl) {
    return mitm.browser.activeUrl.match(ns) || ns==='_global_';
  } else {
    return true;
  }
}
</script>

<td>
{#each Object.keys($tags.__tag2) as ns}
  {#if oneSite(ns)}
    <Tags21 items={$tags.__tag2[ns]} ns={ns}/>
  {/if}
{/each}
</td>

<style>
</style>
