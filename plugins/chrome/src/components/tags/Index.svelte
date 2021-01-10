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

export let top = "23";
let block = true;
let one = false;

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
function oneClick(e) {
  one = !one;
}
</script>

<Button/>
<div class="vbox">
  <details open="true">
    <summary>Enable / Disable Tags</summary>
    <div class="vbox-1">
      <BStatic {top} {block}>
        <BHeader>-Tags- <button on:click="{oneClick}">[one]</button></BHeader>
        <BTable>
          <tr class="set-tags">
            <Tags1 {one}/>
            <Tags2/>
            <Tags3 {one}/>
          </tr>
        </BTable>
      </BStatic>  
    </div>
  </details>
  <details class="urls">
    {@html '<style id="urls"></style>'}
    <summary>Effected Url(s)</summary>
    <Urls/>
  </details>
</div>

<style>
.vbox {
  flex: auto;
  display: flex;
  position: relative;
  flex-direction: column;
  height: calc(100vh - 23px);
}
.vbox-1 {
  margin-bottom: 10px;
}
details, summary {
  outline: none;
}
summary {
  border: none;
  cursor: pointer;
  font-size: 13px;
  padding-left: 5px;
  background: #fdaaaa;
}
.urls summary:hover {
  background-color: #f1f6fbbd;
}
.urls {
  height: 100%;
  display: flex;
  overflow: auto;
  flex-direction: column;
}
.urls summary {
  position: sticky;
  background: white;
  top: 0px;
}
button {
  border: 0;
  cursor: pointer;
  color: #002aff;
  margin-top: -5px;
  margin-right: -5px;
  vertical-align: middle;
  background: transparent;
  padding: 2px 1px 1px 1px;
  font-family: Consolas, Lucida Console, Courier New, monospace;
  font-weight: 700;
  font-size: 10px;
}
</style>
