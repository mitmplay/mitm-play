<script>
import { onMount } from 'svelte';
import { logstore } from './stores.js';
import { client } from '../other/stores.js';

import BStatic from '../box/BStatic.svelte';
import BResize from '../box/BResize.svelte';
import BHeader from '../box/BHeader.svelte';
import BTable from '../box/BTable.svelte';
import Button from './Button.svelte';
import Item from './Item.svelte';
import Show from './Show.svelte';

let json = 163;
let data =  [];

$: _json = json;
$: _data = data;

onMount(async () => {
  console.warn('onMount logs');
  _ws_connect.logOnMount = () => ws__send('getLog', '', logHandler);

  chrome.storage.local.get('json', function(data) {
    data.json && (json = data.json);
  });
});

const logHandler = obj => {
  console.warn('ws__send(getLog)', obj);
  if ( window.mitm.client.clear) {
    delete window.mitm.client.clear;
    logstore.set({
      respHeader: {},
      response: '',
      headers: '',
      logid: '',
      title: '',
      path: '',
      url: '',
      ext: '',
    })
  }
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
  json = detail.left;
  chrome.storage.local.set({json})
}

function nohostlogs(flag) {
  console.log('nohostlogs', flag);
}
</script>

<div class="vbox">
  <BStatic>
    <BHeader>-Logs-</BHeader>
    <Button/>
    <BTable update={nohostlogs($client.nohostlogs)}>
      {#each Object.keys(_data) as logid}
      <Item item={{
        logid,
        ..._data[logid],
        nohostlogs: $client.nohostlogs,
        }}/>
      {/each}
    </BTable>
  </BStatic>
  {#if $logstore.logid}
    <BResize left={_json} on:dragend={dragend}>
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
