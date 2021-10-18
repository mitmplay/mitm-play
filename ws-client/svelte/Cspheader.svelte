<script>
import {onMount} from 'svelte';
import {
  cspArr,
  cspInfo,
  cspFetch,
  cspEAttr,
} from './Cspdirective'
let csp = window.mitm.info.csp
let reportTo = csp.reportTo

onMount(async () => {
  const fallback = true
  const {policy} = csp['default-src'] || {}
  if (policy && policy.length>0) {
    for (const id of cspFetch) {
      if (!csp[id]) {
        csp[id] = {policy, fallback}
      }
    }
  }
  for (const id of cspEAttr) {
    const par = id.replace(/-.{4}$/, '')
    const {policy} = csp[par] || {}
    if (!csp[id] && policy) {
      csp[id] = {policy, fallback}
    }
  }
  if (reportTo!=='JSON Error!' && reportTo?.length > 15) {
    let cb = reportTo.replace(/\n/g,'').trim()
    if (cb[0]==='{' && cb.slice(-1)==='}') {
      cb = JSON.stringify(JSON.parse(`[${cb}]`), null, 2)
      reportTo = cb.replace(/\[|\]/g, '').replace(/\n  /g, '\n').trim()
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
      <details><summary class={csp[id].fallback ? 'fallback' : ''}>
        {#if cspInfo[id].link}
          {i+1}.{id}:({csp[id].policy.length})<a href={cspInfo[id].link}><small>v{cspInfo[id].level}</small></a>
        {:else}
          {i+1}.{id}:({csp[id].policy.length})<small>v{cspInfo[id].level}</small>
        {/if}
      </summary>
        {#if cspInfo[id].note}
          <details class="note"><summary>expand...</summary>
            <small>{@html cspInfo[id].note}</small>
          </details>
        {/if}
        {#each csp[id].policy as item, x}
          <div class="item">{x+1}:{item}</div>
        {/each}
      </details>
    {/if}
    {/each}
    <hr />
    <details><summary class="report"><b>report-to</b>:</summary>
      <details class="note"><summary>expand...</summary>
        <small>{@html 'used to specify details about the different endpoints that a user-agent has available to it for delivering reports to. You can then retrieve reports by making a request to those URLs.'}</small>
      </details>
      <div class="item">{reportTo}</div>
    </details>
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
summary.fallback {
  color: darkred;
}
.item {
  padding-left: 14px;
  font-size: smaller;
  color: #9100cd;
}
</style>