<script>
import { onMount } from 'svelte';
import Item from './Item.svelte';
import { client } from '../other/stores.js';

let rerender = 0;
let data = [];

$: _data = data;

onMount(async () => {
  console.warn('onMount logs');
  _ws_connect.logOnMount = () => ws__send('getLog', '', logHandler);
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

function nohostlogs(flag) {
  console.log('nohostlogs', flag);
}
</script>

{#each Object.keys(_data) as logid}
<Item item={{
  logid,
  ..._data[logid],
  nohostlogs: $client.nohostlogs,
  }}/>
{/each}
