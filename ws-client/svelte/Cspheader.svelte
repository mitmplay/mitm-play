<script>
import {cspArr, cspInfo} from './Cspdirective'
let csp = window.mitm.info.csp
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
          <small>{@html cspInfo[id].note}</small>
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
summary,.item {
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
}
.item {
  padding-left: 14px;
  font-size: smaller;
  color: #9100cd;
}
</style>