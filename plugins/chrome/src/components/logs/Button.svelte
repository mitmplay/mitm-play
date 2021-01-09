<script>
import { client } from '../other/stores.js';
import  Collapse from '../button/Collapse.svelte';
import  Expand from '../button/Expand.svelte';
let st = {
  collapse: true,
  expand: false
};

function btnClear(e) {
  const data = {}
  const arr = document.querySelectorAll('summary.true');
  if (arr.length) {
    const folders = []
    for (let node of arr) {
      folders.push(node.dataset.path)
    }
    data.folders = folders
  }
  ws__send('clearLogs', data, data => {
    // logs view will be close when .log_events.LogsTable
    // logstore.set() to empty on Table.svelte 
    window.mitm.client.clear = true;
    console.log('Done Clear!');
  });
}

function toogle(prop) {
  client.update(n => {
    return {
      ...$client,
      ...prop,
    }
  });
  console.log($client);
  ws__send('setClient', {...prop}, data => {
    console.log('Done change state', data);
    window.mitm.client = data;
  });
}

function btnHostswch(e) {
  toogle({nohostlogs: !e.target.checked});
}

function btnArgswch(e) {
  toogle({noarglogs: !e.target.checked});
}

function hostflag() {
  return !window.mitm.client.nohostlogs;
}

function argsflag() {
  return !window.mitm.client.noarglogs;
}
</script>

<div class="btn-container" style="top: 1px;">
  <input class="stop" on:click="{btnClear}" type="image" src="images/stop.svg" alt=""/>
  <Collapse {st} q="#list-logs"></Collapse>
  <Expand {st} q="#list-logs"></Expand>
  <label class="checkbox">
    <input type="checkbox" on:click={btnHostswch} checked={hostflag()}>host
  </label>
  <label class="checkbox">
    <input type="checkbox" on:click={btnArgswch} checked={argsflag()}>args
  </label>
</div>

<style>
.btn-container {
  position: absolute;
  margin-top: -1px;
  left: 48px;
  top: -3px;
}
.checkbox {
  vertical-align: top;
  padding-top: 2px;
}
.checkbox input {
  cursor: pointer;
  margin-right: 2px;
  vertical-align: middle;
}
input.stop {
  position: relative;
  margin-right: 10px;
  top: 1.5px;
  left: 10px;
}
</style>
