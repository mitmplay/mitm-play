<script>
export let onChange;

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
</script>

{#each Object.keys(_data) as item}
  <Item item={{element: item, ..._data[item]}} {onChange}/>
{/each}
