<script>
import { onMount } from 'svelte';
import { source } from './stores.js';

import BStatic from '../box/BStatic.svelte';
import BResize from '../box/BResize.svelte';
import BHeader from '../box/BHeader.svelte';
import BTable from '../box/BTable.svelte';
import Button from './Button.svelte';
import Item from './Item.svelte';

let route = 163;
let data = [];

let rerender = 0;

$: _route = route;
$: _data = data;

const routeHandler = obj => {
  console.log('ws__send(getRoute)', obj);
  if (window.mitm.files.route===undefined) {
    window.mitm.files.route = obj;
    data = obj;
  } else {
    const {route} = window.mitm.files;
    const newRoute = {};
    for (let k in obj) {
      newRoute[k] = route[k] ? route[k] : obj[k];
      newRoute[k].content = obj[k].content;
    }
    window.mitm.files.route = newRoute
    data = newRoute;
  }
  rerender++;
}

onMount(async () => {
  setTimeout(() => {
    window.ws__send('getRoute', '', routeHandler)
  }, 10);
  chrome.storage.local.get('route', function(data) {
    data.route && (route = data.route);
  });
});

window.mitm.files.route_events.routeTable = () => {
  window.ws__send('getRoute', '', routeHandler);
}

let editbuffer;
let _timeout = null;
function editorChanged(e) {
  let saveDisabled;
  if (e===false) {
    saveDisabled = true;
    source.update(n => {return {...n, saveDisabled}})
    editbuffer = window.editor.getValue();
  }
  _timeout && clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    if (window.editor){
      saveDisabled = (window.editor.getValue()===editbuffer)
      source.update(n => {return {...n, saveDisabled}});
      console.log(e);
    }
  }, 500)  
}

function dragend({detail}) {
  route = detail.left;
  chrome.storage.local.set({route})
}
</script>

<Button/>
<div class="vbox">
  <BStatic height="47">
    <BHeader>-Route(s)-</BHeader>
    <BTable>
      {#each Object.keys(_data) as item}
      <Item item={{element: item, ..._data[item]}} onChanged={editorChanged}/>
      {/each}
    </BTable>
  </BStatic>
  <BResize left={_route} on:dragend={dragend} height="47">
    <div id="code-mirror">
      <textarea id="demotext">{$source.content}</textarea>
    </div>
  </BResize>
</div>


<style>
.vbox {
  flex: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}
#code-mirror {
  font-size: 12px;
  height: calc(100vh - 41px);
  overflow: auto;
}
</style>
