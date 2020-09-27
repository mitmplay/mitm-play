<script>
import { onMount } from 'svelte';
import Item from './Item.svelte';
let rerender = 0;
let data =  [];
$: _data = data;

const cacheHandler = obj => {
  console.log('ws__send(getCache)', obj);
  if (window.mitm.files.cache===undefined) {
    window.mitm.files.cache = obj;
    data = obj;
  } else {
    const {cache} = window.mitm.files;
    const newCache = {};
    for (let k in obj) {
      newCache[k] = cache[k] ? cache[k] : obj[k]; 
    }
    window.mitm.files.cache = newCache
    data = newCache;
  }
  rerender++;
}

onMount(async () => {
  // setTimeout(() => {
  //   ws__send('getCache', '', cacheHandler)
  // }, 10);
  window._ws_connect.cacheOnMount = () => {
     ws__send('getCache', '', cacheHandler)
  };
});

window.mitm.files.cache_events.cacheTable = () => {
  ws__send('getCache', '', cacheHandler)
}
</script>

<table>
  <tr>
    <td>-Cache-</td>
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
