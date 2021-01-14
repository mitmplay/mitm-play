<script>
export let cols;
import { tags } from './stores.js';
import Tags21 from './Tags2_1.svelte';
import { states } from '../button/states.js';

function oneSite(ns) {
  const {toRegex} = window.mitm.fn;
  if ($tags.filterUrl) {
    const rgx = toRegex(ns.replace(/~/,'[^.]*'));
    return mitm.browser.activeUrl.match(rgx) || ns==='_global_';
  } else {
    return true;
  }
}
</script>

<td style="width:{$states.chevron==='[<<]' ? 45 : 35}%; {cols>0 ? '' : 'display:none;'}">
{#each Object.keys($tags.__tag2) as ns}
  {#if oneSite(ns)}
    <Tags21 on:message items={$tags.__tag2[ns]} ns={ns}/>
  {/if}
{/each}
</td>
