<script> // feat: profile
import { onMount } from 'svelte';
import { source } from './stores.js';

import BStatic from '../box/BStatic.svelte';
import BResize from '../box/BResize.svelte';
import BHeader from '../box/BHeader.svelte';
import BTable from '../box/BTable.svelte';
import Button from './Button.svelte';
import Item from './Item.svelte';

let profile = 163;
let data = [];

let rerender = 0;

$: _profile = profile;
$: _data = data;

const profileHandler = obj => {
  console.log('ws__send(getProfile)', obj);
  if (window.mitm.files.profile===undefined) {
    window.mitm.files.profile = obj;
    data = obj;
  } else {
    const {profile} = window.mitm.files;
    const newprofile = {};
    for (let k in obj) {
      newprofile[k] = profile[k] ? profile[k] : obj[k];
      newprofile[k].content = obj[k].content;
    }
    data = newprofile;
    window.mitm.files.profile = newprofile
  }
  /**
   * event handler after receiving ws packet
   * ie: window.mitm.files.getProfile_events = {eventObject...}
   */
  const {getProfile_events} = window.mitm.files;
  for (let key in getProfile_events) {
    getProfile_events[key](data);
  }
  rerender++;
}

onMount(async () => {
  window._ws_connect.profileOnMount = () => {
    window.ws__send('getProfile', '', profileHandler);
  }
  chrome.storage.local.get('profile', function(data) {
    data.profile && (profile = data.profile);
  });

  function initCodeEditor() {
    const element = window.document.getElementById('monaco2');
    const editor =  window.monaco.editor.create(element, {
      language: 'javascript',
      // theme: "vs-dark",
      minimap: {
        enabled: false,
      },
      value: '',
    });

    window.monacoEl2 = element;
    window.monacoEditor2 = editor;
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

window.mitm.files.profile_events.profileTable = () => {
  console.log('profileTable getting called!!!');
  window.ws__send('getProfile', '', profileHandler);
}

let editbuffer;
let _timeout = null;
function editorChanged(e) {
  let saveDisabled;
  if (e===false) {
    saveDisabled = true;
    source.update(n => {return {...n, saveDisabled}})
    editbuffer = window.monacoEditor2.getValue();
  }
  _timeout && clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    if (window.monacoEditor2){
      saveDisabled = (window.monacoEditor2.getValue()===editbuffer)
      source.update(n => {return {...n, saveDisabled}});
      console.log(e);
    }
  }, 500)  
}

function dragend({detail}) {
  profile = detail.left;
  chrome.storage.local.set({profile})
}
</script>

<Button/>
<div class="vbox">
  <BStatic height="47">
    <BHeader>-profile(s)-</BHeader>
    <BTable>
      {#each Object.keys(_data) as item}
      <Item item={{element: item, ..._data[item]}} onChange={editorChanged}/>
      {/each}
    </BTable>
  </BStatic>
  <BResize left={_profile} on:dragend={dragend} height="47">
    <div class="edit-container">
      <div id="monaco2">
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
#monaco2 {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
</style>
