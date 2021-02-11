<script>
import { Tabs } from 'svelma';
import { onMount } from 'svelte';
import { tabstore } from './stores.js';
import BaseTab from './BaseTab.svelte';

onMount(() => {
  setTimeout(()=>{
    const nodes = document.querySelectorAll('.tab-view a');
    for (let [i,node] of nodes.entries()) {
      node.onclick = function(e) {
        tabstore.set({
          ...$tabstore,
          tab: i,
        });
      }
    }
  }, 500);
});
</script>

<Tabs value={$tabstore.tab} style="is-boxed tab-view" size="is-small">
  <BaseTab/>
</Tabs>
