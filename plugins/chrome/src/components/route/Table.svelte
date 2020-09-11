<script>
import { onMount } from 'svelte';
import { source } from './stores.js';

import BStatic from '../box/BStatic.svelte';
import BResize from '../box/BResize.svelte';
import BHeader from '../box/BHeader.svelte';
import BTable from '../box/BTable.svelte';
import Button from './Button.svelte';
import Item from './Item.svelte';

let route = 163;
let data = [];

let rerender = 0;

$: _route = route;
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
    data = newRoute;
    window.mitm.files.route = newRoute
  }
  if (obj._tags_) {
    window.mitm.__tag1 = obj._tags_.__tag1;
    window.mitm.__tag2 = obj._tags_.__tag2;
    window.mitm.__tag3 = obj._tags_.__tag3;
  }
  rerender++;
}

onMount(async () => {
  setTimeout(() => {
    window.ws__send('getRoute', '', routeHandler)
  }, 10);
  chrome.storage.local.get('route', function(data) {
    data.route && (route = data.route);
  });

  function initCodeEditor() {
    const element = window.document.getElementById('monaco');
    const editor =  window.monaco.editor.create(element, {
      language: 'javascript',
      // theme: "vs-dark",
      minimap: {
        enabled: false,
      },
      value: '',
    });

    window.monacoEl = element;
    window.monacoEditor = editor;
    editor.onDidChangeModelContent(editorChanged);

    var ro = new ResizeObserver(entries => {
      const {width: w, height: h} = entries[0].contentRect;
      editor.layout({width: w, height: h})
    });
    ro.observe(element);
  }
  let intervalTic = 0;
  const intervalID = window.setInterval(() => {
    if (window.monaco.editor) {
      console.log('Run', {intervalTic});
      clearInterval(intervalID);
      initCodeEditor();
    } else if (intervalTic > 5) {
      console.log('Out', {intervalTic});
      clearInterval(intervalID);
      initCodeEditor();
    }
    intervalTic += 1;
  }, 100);
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
    editbuffer = window.monacoEditor.getValue();
  }
  _timeout && clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    if (window.monacoEditor){
      saveDisabled = (window.monacoEditor.getValue()===editbuffer)
      source.update(n => {return {...n, saveDisabled}});
      console.log(e);
    }
  }, 500)  
}

function dragend({detail}) {
  route = detail.left;
  chrome.storage.local.set({route})
}
</script>

<Button/>
<div class="vbox">
  <BStatic height="47">
    <BHeader>-Route(s)-</BHeader>
    <BTable>
      {#each Object.keys(_data) as item}
      <Item item={{element: item, ..._data[item]}} onChange={editorChanged}/>
      {/each}
    </BTable>
  </BStatic>
  <BResize left={_route} on:dragend={dragend} height="47">
    <div class="edit-container">
      <div id="monaco">
      </div>
    </div>
  </BResize>
</div>


<style>
.vbox {
  flex: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}

.edit-container {
  position: relative;
  height: calc(100vh - 50px);
}
#monaco {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
</style>
