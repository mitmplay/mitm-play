<script>
import { tags } from './stores.js';
import Tags31 from './Tags3_1.svelte';

function istag(ns) {
  const {toRegex} = window.mitm.fn;
  const arr = Object.keys($tags.__tag2[ns]);
  const ok = arr.filter(x=>!x.match(':')).length;
  if ($tags.filterUrl) {
    const rgx = toRegex(ns.replace(/~/,'[^.]*'));
    return ok && mitm.browser.activeUrl.match(rgx) || ns==='_global_';
  } else {
    return ok;
  }
}
</script>

<td>
{#each Object.keys($tags.__tag3) as ns}
  {#if istag(ns)}
    <Tags31 items={$tags.__tag3[ns]} {ns}/>
  {/if}
{/each}
</td>

<style>
</style>