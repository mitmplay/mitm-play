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

onMount(async () => {

});

window.mitm.files.getRoute_events.tagsTable = () => {
  // window.ws__send('getRoute', '', routeHandler);
  console.log('tagsTable getting called!!!');
  const {__tag1, __tag2, __tag3} = window.mitm;
  const {filterUrl} = $tags;
  tags.set({
    filterUrl,
    __tag1,
    __tag2,
    __tag3,
  })
}
</script>

<Button/>
<div class="vbox">
  <BStatic height="0">
    <BHeader>-Tags-</BHeader>
    <BTable>
      <tr class="set-tags">
        <Tags1/>
        <Tags2/>
        <Tags3/>
      </tr>
    </BTable>
  </BStatic>
</div>

<style>
.vbox {
  flex: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>
