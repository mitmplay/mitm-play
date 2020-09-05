<script>
import { onMount } from 'svelte';
import { Tabs, Tab } from 'svelma';
import { tabstore } from './tab.js';
import BaseTab from './BaseTab.svelte';

onMount(() => {
  setTimeout(()=>{
    const nodes = document.querySelectorAll('.tab-json a');
    for (let [i,node] of nodes.entries()) {
      node.onclick = function(e) {
        tabstore.set({tab: i});
      }
    }
  }, 500);
});
</script>

<Tabs value={$tabstore.tab} style="is-boxed tab-json" size="is-small">
  <BaseTab/>
</Tabs>
