<script>
import { onMount } from 'svelte';
import Item from './Item.svelte';
let rerender = 0;
let data =  [];
$: _data = data;

const logHandler = obj => {
  console.log('ws__send(getLog)', obj);
  const {log} = window.mitm.files;
  const newLog = {};
  for (let k in obj) {
    newLog[k] = log[k] ? log[k] : obj[k]; 
  }
  window.mitm.files.log = newLog
  data = newLog;
  rerender++;
}

onMount(async () => {
  setTimeout(() => {
    ws__send('getLog', '', logHandler)
  }, 10);
});

window.mitm.files.log_events.LogsTable = () => {
  ws__send('getLog', '', logHandler)
}
</script>

<table>
  <tr>
    <td>-Network-</td>
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
