<script>
import { source } from './stores.js';
import { onMount } from 'svelte';
import Item from './Item.svelte';

let data = [];
let rerender = 0;
let btnDisabled = true;

$: _data = data;

const routeHandler = obj => {
  console.log('ws__send(getRoute)', obj);
  if (window.mitm.files.route===undefined) {
    window.mitm.files.route = obj;
    data = obj;
  } else {
    const {route} = window.mitm.files;
    const newRoute = {};
    for (let k in obj) {
      newRoute[k] = route[k] ? route[k] : obj[k];
      newRoute[k].content = obj[k].content;
    }
    window.mitm.files.route = newRoute
    data = newRoute;
  }
  rerender++;
}

onMount(async () => {
  setTimeout(() => {
    ws__send('getRoute', '', routeHandler)
  }, 10);

});

window.mitm.files.route_events.routeTable = () => {
  ws__send('getRoute', '', routeHandler);
}

function btnSave(e) {
  source.update(n => {
    return {...n, content: window.editor.getValue()}
  })
  console.log($source);

  ws__send('saveRoute', $source, data => {
    console.log('Done Save!');
  });
}

let editbuffer;
let _timeout = null;
function editorChanged(e) {
  if (e===false) {
    btnDisabled = true;
    editbuffer = window.editor.getValue();
  }
  _timeout && clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    if (window.editor){
      btnDisabled = (window.editor.getValue()===editbuffer)
      console.log(e);
    }
  }, 500)  
}
</script>

<div class="file-path">
Path:{$source.path}
{#if $source.path}
	<div class="btn-container">
  <button class="btn-save"
  disabled={btnDisabled}
  on:click="{btnSave}">Save</button>
  </div>
{/if}
</div>
<table class="main-table">
  <tr>
    <td class="main-td1">
      <table class="table-title"><tr><td>-Route(s)-</td></tr></table>
      <div class="table-container">
      <table id="uniq-{rerender}">
        {#each Object.keys(_data) as item}
        <Item item={{element: item, ..._data[item]}} onChanged={editorChanged}/>
        {/each}
      </table>
      </div>
    </td>
    <td>
    <div id="code-mirror">
      <textarea id="demotext">{$source.content}</textarea>
    </div>
    </td>
  </tr>
</table>

<style>
.file-path {
  font-family: auto;
  font-size: 0.9em;
  color: blue;
}
.btn-container {
  float: right;
  padding-right: 4px;
}
.btn-container button {
  font-size: 10px;
}
.main-table {
  width: 100%
}
.main-td1 {
  width: 145px;
}
#code-mirror {
  height: calc(100vh - 61px);
  width: calc(100vw - 163px);
  overflow: auto;
}
.table-title {
  width: 100%;
  font-weight: bold;
  background-color: bisque;
}
.table-container {
  overflow: auto;
  height: calc(100vh - 96px);
}
table {
  border-collapse: collapse;
  font-family:  Consolas, Lucida Console, Courier New, monospace;
  font-size: 12px;
  /* width: 100%; */
}
td {
  border: 1px solid #999;
  padding: 0.1rem;
}
</style>
