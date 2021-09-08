<script>
export let onChange;

import { urls } from '../tags/url-debounce';
import { list } from '../tags/stores';
import { onMount } from 'svelte';
import Item from './Item.svelte';
const _c = 'color: blueviolet'

let rerender = 0;
let data = [];

$: _data = data;

onMount(async () => {
  console.log('%cRoute: onMount route/list', _c);
  _ws_connect.routeOnMount = () => ws__send('getRoute', '', routeHandler);
});

const routeHandler = obj => {
  console.log('%cRoute: ws__send(getRoute)', _c, obj);
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
      if (_subns.match('@')) { // feat: only for sub-apps
        _childns.list[_subns] = true
      }
      _childns._subns = _subns
    }
  }
  if (obj._tags_) {
    const {__tag1,__tag2,__tag3,__tag4,__urls} = obj._tags_
    const {mitm}= window
    mitm.__tag1 = __tag1
    mitm.__tag2 = __tag2
    mitm.__tag3 = __tag3
    mitm.__tag4 = __tag4
    mitm.__urls = __urls
    // feat: add placeholder to fix UI
    for (const ns of mitm.routez) {
      mitm.__tag1[ns] = {...__tag1[ns]}
      mitm.__tag2[ns] = {...__tag2[ns]}
      mitm.__tag3[ns] = {...__tag3[ns]}
    }
    const {_global_:g2} = mitm.__tag2
    const {_global_:g3} = mitm.__tag3
    delete mitm.__tag2._global_
    delete mitm.__tag3._global_
    mitm.__tag2._global_ = g2
    mitm.__tag3._global_ = g3
    // feat: add placeholder to fix UI
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
  console.log('%cRoute: routeTable getting called!!!', _c);
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