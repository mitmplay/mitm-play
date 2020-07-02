<script>
import { source } from './stores.js';
import { onMount } from 'svelte';
import Button from './Button.svelte';
import Item from './Item.svelte';

let data = [];
let rerender = 0;

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
    window.ws__send('getRoute', '', routeHandler)
  }, 10);

});

window.mitm.files.route_events.routeTable = () => {
  window.ws__send('getRoute', '', routeHandler);
}

let editbuffer;
let _timeout = null;
function editorChanged(e) {
  let saveDisabled;
  if (e===false) {
    saveDisabled = true;
    source.update(n => {return {...n, saveDisabled}})
    editbuffer = window.editor.getValue();
  }
  _timeout && clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    if (window.editor){
      saveDisabled = (window.editor.getValue()===editbuffer)
      source.update(n => {return {...n, saveDisabled}});
      console.log(e);
    }
  }, 500)  
}
</script>

<Button/>
<table class="main-table">
  <tr>
    <td class="main-td1">
      <table class="table-title"><tr><td>-Route(s)-</td></tr></table>
      <div class="table-container">
      <table id="uniq-{rerender}" class="table-content">
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
.main-table,
.table-content {
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
  border-bottom: 3px solid #c0d8cca1;
  /* background-color: aliceblue; */
  font-weight: bold;
  padding: 0.1rem;
}
</style>
