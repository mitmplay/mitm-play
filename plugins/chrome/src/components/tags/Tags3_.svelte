<script>
export let cols;
export let _resize;
import { tags } from './stores.js';
import Tags31 from './Tags3_1.svelte';

function istag(ns) {
  const {toRegex} = window.mitm.fn;
  const arr = Object.keys($tags.__tag2[ns]);
  let ok = arr.filter(x=> x.match('url:') || !x.match(':')).length;
  if ($tags.filterUrl) {
    const rgx = toRegex(ns.replace(/~/,'[^.]*'));
    ok = ok && mitm.browser.activeUrl.match(rgx) || ns==='_global_';
  }
  return ok;
}
</script>

<td style="width:{_resize==='[<<]' ? 35 : 45}%; {cols===3 ? '' : 'display:none;'}">
{#each Object.keys($tags.__tag3) as ns}
  {#if istag(ns)}
    <Tags31 items={$tags.__tag3[ns]} {ns}/>
  {/if}
{/each}
</td>
