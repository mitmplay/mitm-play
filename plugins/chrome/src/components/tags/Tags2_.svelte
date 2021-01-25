<script>
export let cols;
import { tags } from './stores.js';
import Tags21 from './Tags2_1.svelte';
import { states } from '../button/states.js';

function nspace(ns) {
  const {_subns} = window.mitm.routes[ns]._childns
  return _subns || ns // feat: chg to child namespace
}
</script>

<td style="width:{$states.chevron==='[<<]' ? 45 : 35}%; {cols>0 ? '' : 'display:none;'}">
{#each Object.keys($tags.__tag2) as ns}
  {#if window.mitm.fn.oneSite($tags, ns)}
    <Tags21 on:message items={$tags.__tag2[nspace(ns)]} ns={nspace(ns)}/>
  {/if}
{/each}
</td>
