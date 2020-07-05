<script>
import { onMount } from 'svelte';
import { source } from './stores.js';

import BStatic from '../box/BStatic.svelte';
import BResize from '../box/BResize.svelte';
import Button from './Button.svelte';
import Item from './Item.svelte';
import Show from './Show.svelte';

let left = 163;
let data =  [];

$: _left = left;
$: _data = data;

onMount(async () => {
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

function dragend({detail}) {
  left = detail.left;
}
</script>

<div class="vbox">
  <BStatic>
    <table class="table-header">
      <tr>
        <td>
          <div class="td-header">
            -Logs-
          </div>
        </td>
      </tr>
    </table>
    <Button/>
    <table class="table-content">
      {#each Object.keys(_data) as item}
      <Item item={{element: item, ..._data[item]}}/>
      {/each}
    </table>
  </BStatic>
  {#if $source.element}
    <BResize left={_left} on:dragend={dragend}>
      <Show/>
    </BResize>
  {/if}
</div>

<style>
.vbox {
  flex: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}
.table-header {
  position: fixed;
}
.table-content {
  margin-top: 19px
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
