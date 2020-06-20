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
<script>
import { onMount } from 'svelte';
import Item from './Item.svelte';

let data =  [];
$: _data = data;

onMount(async () => {
  setTimeout(() => {
    ws__send('getLog', '', obj => {
      console.log('ws__send(getLog)', obj);
      if (!window.mitm.files.log) {
        window.mitm.files.log = obj
      }
      data = obj;
    })
  }, 10);
});

window.mitm.files.log_events.LogsTable = function(obj) {
  ws__send('getLog', '', obj => {
    console.log('ws__send(getLog)', obj);
    const {log} = window.mitm.files;
    if (log) {
      obj = {
        ...log,
        ...obj,
      } 
    }
    window.mitm.files.log = obj
    data = obj;
  })
}

</script>
<table>
  <tr>
    <td>-Network-</td>
  </tr>
</table>
<div class="table-container">
<table>
  {#each Object.keys(_data) as item}
  <Item item={{element: item, ..._data[item]}}/>
  {/each}

</table>
</div>
