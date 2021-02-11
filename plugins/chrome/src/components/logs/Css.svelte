<script>
import { Tabs } from 'svelma';
import { onMount } from 'svelte';
import { tabstore } from './stores.js';
import Button2 from './Button2.svelte';
import BaseTab from './BaseTab.svelte';

onMount(() => {
  setTimeout(()=>{
    const nodes = document.querySelectorAll('.tab-css a');
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

<Button2/>
<Tabs value={$tabstore.tab} style="is-boxed tab-css" size="is-small">
  <BaseTab/>
</Tabs>
