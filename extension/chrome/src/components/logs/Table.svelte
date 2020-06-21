<script>
import { onMount } from 'svelte';
import Item from './Item.svelte';
import Show from './Show.svelte';
import { source } from './stores.js';

let rerender = 0;
let data =  [];
$: _data = data;

const logHandler = obj => {
  console.log('ws__send(getLog)', obj);
  if (window.mitm.files.log===undefined) {
    window.mitm.files.log = obj;
    data = obj;
  } else {
    const {log} = window.mitm.files;
    const newLog = {};
    for (let k in obj) {
      newLog[k] = log[k] ? log[k] : obj[k]; 
    }
    window.mitm.files.log = newLog
    data = newLog;
  }
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
<div class="vbox">
  <div class="vbox left">
    <table>
      <tr>
        <td>-Logs-</td>
      </tr>
    </table>
    <div class="table-container">
      <table id="uniq-{rerender}">
        {#each Object.keys(_data) as item}
        <Item item={{element: item, ..._data[item]}}/>
        {/each}
      </table>
    </div>
  </div>
  {#if $source.element}
    <div class="vbox right">
      <Show item={$source.element}/>
    </div>
  {/if}
</div>

<style>
.vbox.right {
  right: 0;
  position: absolute;
  background: #f1f7f7e3;
  width: calc(100vw - 163px);
  height: calc(100vh - 27px);
}
.vbox {
  flex: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}
.table-container {
  overflow: auto;
  height: calc(100vh - 45px);
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
