<script>
import { logstore } from './stores.js';
import { onMount } from 'svelte';
import Item from './Item.svelte';
import Summary from './Summary.svelte';
import { client } from '../other/stores.js';
const _c = 'color: blueviolet'

let rerender = 0;
let data = [];

$: _data = data;

onMount(async () => {
  console.log('%cLogs: onMount logs/list', _c);
  _ws_connect.logOnMount = () => ws__send('getLog', '', logHandler);
});

const logHandler = obj => {
  console.log('%cLogs: ws__send(getLog)', _c, obj);
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
  const {files} = window.mitm
  if (files.log===undefined) {
    files.log = obj;
    data = obj;
  } else {
    const {log} = files;
    const newLog = {};
    for (let k in obj) {
      newLog[k] = obj[k];
    }
    data = newLog;
    const ln1 = Object.keys(log)
    const ln2 = Object.keys(newLog)
    if (ln2<ln1) {
      const nodes1 = document.querySelectorAll('#list-logs details[open]')
      nodes1.forEach(node => node.removeAttribute('open'))

      const nodes2 = document.querySelectorAll('#list-logs summary input:checked')
      nodes2.forEach(node => node.checked = false)
    }
    files.log = newLog
  }
}

window.mitm.files.log_events.LogsTable = () => {
  ws__send('getLog', '', logHandler)
}

function nohostlogs(flag) {
  console.log('%cLogs: nohostlogs', _c, flag);
}

</script>

<div id="list-logs">
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
</div>
