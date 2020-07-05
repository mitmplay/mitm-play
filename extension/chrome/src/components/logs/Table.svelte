<script>
import { onMount } from 'svelte';

import Item from './Item.svelte';
import Show from './Show.svelte';
import Button from './Button.svelte';
import Resize from './Resize.svelte';
import { source } from './stores.js';

let data =  [];
$: _data = data;

onMount(async () => {
  window._codeResize = 163;
  setTimeout(() => {
    ws__send('getLog', '', logHandler)
  }, 10);
});

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
}
window.mitm.files.log_events.LogsTable = () => {
  ws__send('getLog', '', logHandler)
}
function resize() {
  const left = window._codeResize || 163;
  return `left: ${left}px;`
}
</script>

<div class="vbox">
  <div class="vbox left">
    <table>
      <tr>
        <td>
          <div class="td-header">
            -Logs-
          </div>
        </td>
      </tr>
    </table>
    <Button/>
    <div class="table-container">
      <table>
        {#each Object.keys(_data) as item}
        <Item item={{element: item, ..._data[item]}}/>
        {/each}
      </table>
    </div>
  </div>
  {#if $source.element}
    <div class="vbox right" style="{resize()}">
      <Resize/>
      <Show/>
    </div>
  {/if}
</div>

<style>
.vbox.right {
  right: 0;
  left: 163px;
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
.td-header {
  padding-left: 5px;
}
table {
  border-collapse: collapse;
  font-family:  Consolas, Lucida Console, Courier New, monospace;
  font-size: 12px;
  width: 100%;
}
td {
  /* border: 1px solid #999; */
  border-bottom: 3px solid #c0d8cca1;
  background-color: aliceblue;
  font-weight: bold;
  padding: 0.1rem;
}
</style>
