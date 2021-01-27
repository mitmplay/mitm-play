<script>
export let cols;
export let _resize;
import { tags } from './stores.js';
import Tags31 from './Tags3_1.svelte';

function istag(ns) {
  const {toRegex} = window.mitm.fn;
  const arr = Object.keys($tags.__tag2[ns]);
  let ok = arr.filter(x=> x.match('url:') || !x.match(':')).length;
  if (ns.match('@')) {
    ok = false
  } else  if ($tags.filterUrl) {
    const rgx = toRegex(ns.replace(/~/,'[^.]*'));
    ok = ok && mitm.browser.activeUrl.match(rgx) || ns==='_global_';
  }
  return ok;
}
function nspace(ns) {
  const {_subns} = window.mitm.routes[ns]._childns
  return _subns || ns // feat: chg to child namespace
}
</script>

<td style="width:{_resize==='[<<]' ? 35 : 45}%; {cols===3 ? '' : 'display:none;'}">
{#each Object.keys($tags.__tag3) as ns}
  {#if istag(ns)}
    <!-- feat: auto collapsed between tag2 & tag3 -->
    <Tags31 on:message items={$tags.__tag3[nspace(ns)]} ns={nspace(ns)}/>
  {/if}
{/each}
</td>
