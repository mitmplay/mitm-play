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
  <button on:click="{btnClear}">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10pt" height="10pt" viewBox="0 0 10 10" version="1.1">
      <g id="surface1"><path style=" stroke:none;fill-rule:nonzero;fill:red;fill-opacity:1;" d="M 5 0.15625 C 2.324219 0.15625 0.15625 2.324219 0.15625 5 C 0.15625 7.675781 2.324219 9.84375 5 9.84375 C 7.675781 9.84375 9.84375 7.675781 9.84375 5 C 9.84375 2.324219 7.675781 0.15625 5 0.15625 Z M 7.542969 2.457031 C 8.820312 3.738281 8.910156 5.691406 7.945312 7.0625 L 2.9375 2.054688 C 4.308594 1.089844 6.261719 1.179688 7.542969 2.457031 Z M 2.457031 7.542969 C 1.179688 6.261719 1.089844 4.308594 2.054688 2.9375 L 7.0625 7.945312 C 5.691406 8.910156 3.738281 8.820312 2.457031 7.542969 Z M 2.457031 7.542969 "/></g>
    </svg>
  </button>  
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
button {
  border: 0;
  cursor: pointer;
  background: transparent;
  font-family: Consolas, Lucida Console, Courier New, monospace;
}
button.clollapse {
  padding: 1px;
  font-weight: 700;
  font-size: 10px;
  color: #002aff;
  margin-top: -5px;
  vertical-align: middle;
}
</style>
