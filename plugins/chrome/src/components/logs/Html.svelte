<script>
import { Tabs } from 'svelma';
import { onMount } from 'svelte';
import { tabstore } from './stores.js';
import Button2 from './Button2.svelte';
import BaseTab from './BaseTab.svelte';
const _c = 'color: blueviolet'

onMount(() => {
  console.log('%cLogs: onMount logs/html', _c);
  setTimeout(()=>{
    const nodes = document.querySelectorAll('.tab-html a');
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
<Tabs value={$tabstore.tab} style="is-boxed tab-html" size="is-small">
  <BaseTab/>
</Tabs>
