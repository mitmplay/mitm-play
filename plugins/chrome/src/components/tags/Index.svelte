<script>
import { onMount } from 'svelte';
import { tags } from './stores.js';

import BStatic from '../box/BStatic.svelte';
import BHeader from '../box/BHeader.svelte';
import BTable from '../box/BTable.svelte';
import Button from './Button.svelte';
import Tags1 from './Tags1_.svelte'; 
import Tags2 from './Tags2_.svelte'; 
import Tags3 from './Tags3_.svelte'; 
import Urls from './Urls.svelte';

export let top = "0";
let block = true;

onMount(async () => {
  console.warn('onMount tags/index');
});

window.mitm.files.getRoute_events.tagsTable = () => {
  // window.ws__send('getRoute', '', routeHandler);
  console.log('events.tagsTable...');
  const {__tag1, __tag2, __tag3} = window.mitm;
  const {filterUrl, uniq} = $tags;
  const tgroup = {};
  for (let ns in __tag2) {
    const tsks = __tag2[ns]
    for (let task in tsks) {
      const [k,v] = task.split(':');
      if (v && k!=='url') {
        tgroup[v] = true
      }
    }
  } 
  tags.set({
    filterUrl,
    __tag1,
    __tag2,
    __tag3,
    tgroup,
    uniq
  })
}
</script>

<Button/>
<div class="vbox">
  <details open="true">
    <summary>Enable / Disable Tags</summary>
    <BStatic {top} {block}>
      <BHeader>-Tags-</BHeader>
      <BTable>
        <tr class="set-tags">
          <Tags1/>
          <Tags2/>
          <Tags3/>
        </tr>
      </BTable>
    </BStatic>
  </details>
  <details>
    <summary>Effected Url(s)</summary>
    <Urls/>
  </details>
</div>

<style>
.vbox {
  flex: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>
