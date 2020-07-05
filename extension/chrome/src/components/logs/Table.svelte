<script>
import { onMount } from 'svelte';
import { source } from './stores.js';

import BStatic from '../box/BStatic.svelte';
import BResize from '../box/BResize.svelte';
import BHeader from '../box/BHeader.svelte';
import BTable from '../box/BTable.svelte';
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
    <BHeader>-Logs-</BHeader>
    <Button/>
    <BTable>
      {#each Object.keys(_data) as item}
      <Item item={{element: item, ..._data[item]}}/>
      {/each}
    </BTable>
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
</style>
