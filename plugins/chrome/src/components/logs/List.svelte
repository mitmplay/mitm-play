<script>
import { logstore } from './stores.js';
import { onMount } from 'svelte';
import Item from './Item.svelte';
import Summary from './Summary.svelte';
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
      newLog[k] = obj[k];
    }
    data = newLog;
    window.mitm.files.log = newLog
  }
}

window.mitm.files.log_events.LogsTable = () => {
  ws__send('getLog', '', logHandler)
}

function nohostlogs(flag) {
  console.log('nohostlogs', flag);
}

</script>

{#each Object.keys(_data) as key, i}
<details><Summary item={_data[key]} {key} />
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
