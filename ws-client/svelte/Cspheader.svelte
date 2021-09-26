<script>
import {onMount} from 'svelte';
import {
  cspArr,
  cspInfo,
  cspFetch,
  cspEAttr,
} from './Cspdirective'
let csp = window.mitm.info.csp

onMount(async () => {
  if (csp['default-src'].length>1) {
    const fallback = csp['default-src']
    for (const id of cspFetch) {
      if (!csp[id]) {
        csp[id] = ['*fallback*', ...fallback]
      }
    }
  }
  for (const id of cspEAttr) {
    const par = id.replace(/-.{4}$/, '')
    if (!csp[id] && csp[par]) {
      csp[id] = csp[par]
    }
  }
})
</script>

<div class="vbox">
  <b>Content Security Policy</b>
  <p>
    CSP on:
    <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP">Mozilla</a>, 
    <a href="https://content-security-policy.com/">content-security-policy.com</a>,
    <a href="https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html">OWASP-cheat-sheet</a>
  </p>
  <div>
    {#each cspArr as id, i}
    {#if csp[id]}      
      <details><summary>
        {#if cspInfo[id].link}
          {i+1}.<a href={cspInfo[id].link}>{id}:</a>({csp[id].length})<small>v{cspInfo[id].level}</small>
        {:else}
          {i+1}.{id}:({csp[id].length})<small>v{cspInfo[id].level}</small>
        {/if}
      </summary>
        {#if cspInfo[id].note}
          <details class="note"><summary>expand...</summary>
            <small>{@html cspInfo[id].note}</small>
          </details>
        {/if}
        {#each csp[id] as item, x}
          <div class="item">{x+1}:{item}</div>
        {/each}
      </details>
    {/if}
    {/each}  
  </div>
</div>

<style type="text/scss">
details.note {
  padding-left: 14px;
  padding-bottom: 3px;
  summary {
    color: red;
    cursor: pointer;
    font-size: x-small;
    margin-left: -14px;
    padding-left: 14px;
    list-style: none;
    &::-webkit-details-marker {
      display: none;
    }
    &:hover {
      background-color: lightgoldenrodyellow;
    }
  }
} 
summary,.item {
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  font-size: small;
  &:hover {
    background-color: lightblue;
  }
}
.item {
  padding-left: 14px;
  font-size: smaller;
  color: #9100cd;
}
</style>