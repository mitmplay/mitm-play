<script>
import { logstore } from './stores.js';
import { Tabs, Tab } from 'svelma';
import BaseTab from './BaseTab.svelte';

function isCSP() {
  const h = $logstore.respHeader;
  const csp = h['content-security-policy'] || h['content-security-policy-report-only'];
  return csp;
}

function parseCSP() {
  const h = $logstore.respHeader;
  const csp = h['content-security-policy'] || h['content-security-policy-report-only'];
  return JSON.stringify(csp.split(/; */), null, 2);
}
</script>

<Tabs style="is-boxed" size="is-small">
  <BaseTab/>
  {#if isCSP()}
    <Tab label="CSP">
      <pre>{parseCSP()}</pre>
      Content...
    </Tab>
  {/if}
</Tabs>

<style>
pre{
  padding: 0 0 0 5px;
}
</style>
