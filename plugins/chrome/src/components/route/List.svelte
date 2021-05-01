<script>
export let onChange;

import { urls } from '../tags/url-debounce';
import { list } from '../tags/stores';
import { onMount } from 'svelte';
import Item from './Item.svelte';

let rerender = 0;
let data = [];

$: _data = data;

onMount(async () => {
  console.warn('onMount route/list');
  _ws_connect.routeOnMount = () => ws__send('getRoute', '', routeHandler);
});

const routeHandler = obj => {
  console.warn('ws__send(getRoute)', obj);
  window.mitm.routel = obj.routel
  window.mitm.routes = obj.routes
  window.mitm.routez = obj.routez
  list.set({
    ...$list,
    routel:  obj.routel,
    routez: obj.routez
  })
  const {routes} = window.mitm
  for (const _ns in obj.routel) {
    const {list} = obj.routel[_ns]
    for (const itm in list) {
      routes[itm]._childns = obj.routel[_ns]
    }
    const {_childns: _childold} = routes[_ns]
    routes[_ns]._childns = obj.routel[_ns]
    const {_childns} = routes[_ns]
    if (_childold && _childold._subns) {
      const {_subns} = _childold
      _childns.list[_subns] = true
      _childns._subns = _subns
    }
  }
  if (obj._tags_) {
    window.mitm.__tag1 = obj._tags_.__tag1;
    window.mitm.__tag2 = obj._tags_.__tag2;
    window.mitm.__tag3 = obj._tags_.__tag3;
    window.mitm.__tag4 = obj._tags_.__tag4;
    window.mitm.__urls = obj._tags_.__urls;
    setTimeout(() => urls(), 1)
  }
  if (window.mitm.files.route===undefined) {
    window.mitm.files.route = obj.files;
    data = obj.files;
  } else {
    const {route} = window.mitm.files;
    const {files} = obj;
    const newRoute = {};
    for (let k in files) {
      newRoute[k] = route[k] ? route[k] : files[k];
      newRoute[k].content = files[k].content;
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

function xlist(all) {
  return Object.keys(_data).filter(x => !x.match(/(@|\/macros)/))
}

function childs(item) {
  const route = window.mitm.routes[item]
  return Object.keys(route._childns.list)
}

function isGroup(item) {
  const route = window.mitm.routes[item]
  const arr = Object.keys(route._childns.list)
  return arr.length
}
</script>

{#each xlist(_data) as item}
  {#if isGroup(item)}
  <details>
    <summary class="space1">
    <Item item={{element: item, ..._data[item]}} {onChange} group="group"/>
    </summary>
    {#each childs(item) as item2}
      <Item item={{element: item2, ..._data[item2]}} {onChange} group="child"/>
    {/each}
  </details>
  {:else}
    <Item item={{element: item, ..._data[item]}} {onChange}/>
  {/if}
{/each}

<style>
summary {
  border-bottom: 1px solid #c0d8cca1;
  padding-left: 2px;
}
</style>