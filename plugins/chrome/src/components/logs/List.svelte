<script>
import { logstore } from './stores.js';
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

// function title(key, i) {
//   const browser = key.split('~')[0]
//   const count = `${i}`.padStart(2, '0')
//   return `${browser}~${count}`
// }
</script>

{#each Object.keys(_data) as key, i}
  <details><summary>{@html key}</summary>
  {#each Object.keys(_data[key]) as logid}
  <Item item={{
    key,
    logid,
    ..._data[key][logid],
    nohostlogs: $client.nohostlogs,
    }}/>
  {/each}
</details>  
{/each}

<style>
  summary:hover {
    background: #eae4f1;
  }
</style>