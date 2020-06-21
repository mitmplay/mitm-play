<script>
import { onMount } from 'svelte';
import Item from './Item.svelte';

let data = [];
let rerender = 0;

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
    ws__send('getRoute', '', routeHandler)
  }, 10);
});

window.mitm.files.route_events.routeTable = () => {
  ws__send('getRoute', '', routeHandler)
}
</script>

<table>
  <tr>
    <td>-Code-</td>
  </tr>
</table>
<div class="table-container">
<table id="uniq-{rerender}">
  {#each Object.keys(_data) as item}
  <Item item={{element: item, ..._data[item]}}/>
  {/each}
</table>
</div>

<style>
.table-container {
  overflow: auto;
  height: calc(100vh - 96px);
}
table {
  border-collapse: collapse;
  font-family:  Consolas, Lucida Console, Courier New, monospace;
  font-size: 12px;
  width: 100%;
}
td {
  border: 1px solid #999;
  padding: 0.1rem;
}
</style>
