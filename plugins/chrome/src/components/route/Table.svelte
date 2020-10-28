<script>
import { onMount } from 'svelte';
import { source } from './stores.js';

import BStatic from '../box/BStatic.svelte';
import BResize from '../box/BResize.svelte';
import BHeader from '../box/BHeader.svelte';
import BTable from '../box/BTable.svelte';
import Button from './Button.svelte';
import Item from './Item.svelte';

let rerender = 0;
let route = 163;
let data = [];

$: _route = route;
$: _data = data;

onMount(async () => {
  console.warn('onMount route');
  _ws_connect.routeOnMount = () => ws__send('getRoute', '', routeHandler);

  chrome.storage.local.get('route', function(data) {
    data.route && (route = data.route);
  });
});

const routeHandler = obj => {
  console.warn('ws__send(getRoute)', obj);
  if (obj._tags_) {
    window.mitm.__tag1 = obj._tags_.__tag1;
    window.mitm.__tag2 = obj._tags_.__tag2;
    window.mitm.__tag3 = obj._tags_.__tag3;
    window.mitm.__tag4 = obj._tags_.__tag4;
  }
  if (window.mitm.files.route===undefined) {
    window.mitm.files.route = obj.routes;
    data = obj.routes;
  } else {
    const {route} = window.mitm.files;
    const newRoute = {};
    const {routes} = obj;
    for (let k in routes) {
      newRoute[k] = route[k] ? route[k] : routes[k];
      newRoute[k].content = routes[k].content;
    }
    data = newRoute;
    window.mitm.files.route = newRoute
  }
  /**
   * event handler after receiving ws packet
   * ie: window.mitm.files.getRoute_events = {eventObject...}
   */
  const {getRoute_events} = window.mitm.files;
  for (let key in getRoute_events) {
    getRoute_events[key](data);
  }
  rerender = rerender + 1;
}

window.mitm.files.route_events.routeTable = () => {
  console.log('routeTable getting called!!!');
  window.ws__send('getRoute', '', routeHandler);
}

let editbuffer;
let _timeout = null;
function editorChanged(e) {
  const { editor: { _route }} = window.mitm;
  let saveDisabled;
  if (e===false) {
    saveDisabled = true;
    source.update(n => {return {...n, saveDisabled}})
    editbuffer = _route.getValue();
  }
  _timeout && clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    if (_route){
      saveDisabled = (_route.getValue()===editbuffer)
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
      <Item item={{element: item, ..._data[item]}} onChange={editorChanged}/>
      {/each}
    </BTable>
  </BStatic>
  <BResize left={_route} on:dragend={dragend} height="47">
    <div class="edit-container">
      <div id="monaco">
      </div>
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

.edit-container {
  position: relative;
  height: calc(100vh - 50px);
}
#monaco {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
</style>
