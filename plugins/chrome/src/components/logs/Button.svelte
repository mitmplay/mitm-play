<script>
import { client } from '../other/stores.js';

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

function btnClose() {
  const nodes = document.querySelectorAll('#list-logs details[open]')
  nodes.forEach(node => node.removeAttribute('open'))
}
</script>

<div class="btn-container" style="top: 1px;">
  <input class="stop" on:click="{btnClear}" type="image" src="images/stop.svg" alt=""/>
  <button class="clollapse" on:click="{btnClose}">[--]</button>
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
  top: 1.5px;
  left: 10px;
}
button {
  border: 0;
  cursor: pointer;
  background: transparent;
  font-family: Consolas, Lucida Console, Courier New, monospace;
}
button.clollapse {
  margin-top: -6px;
  margin-left: 10px;
  padding: 2px 1px 1px 1px;
  font-weight: 700;
  font-size: 10px;
  color: #002aff;
  margin-top: -5px;
  vertical-align: middle;
}
</style>
