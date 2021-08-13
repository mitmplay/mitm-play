<script>
export let cols;
export let _resize=undefined;
import { tags } from './stores.js';
import Tags31 from './Tags3_1.svelte';

function istag(tags, ns) {
  const {__tag2, filterUrl} = tags;
  const {toRegex, oneSite} = window.mitm.fn;
  const arr =  oneSite(tags, ns) ? Object.keys(__tag2[ns]) : [];
  let ok = arr.filter(x=> x.match('url:') || !x.match(':')).length;
  if (ns.match('@')) {
    ok = false
  } else  if (filterUrl) {
    const rgx = toRegex(ns.replace(/~/g,'[^.]*'));
    ok = ok && mitm.browser.activeUrl.match(rgx) || oneSite(tags, ns); //ns==='_global_';
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
  {#if istag($tags, ns)}
    <!-- feat: auto collapsed between tag2 & tag3 -->
    <Tags31 on:message items={$tags.__tag3[nspace(ns)]} ns={nspace(ns)}/>
  {/if}
{/each}
</td>
