<script>
import { onMount } from 'svelte';
import { source } from './stores.js';

import VBox2 from '../box/VBox2.svelte';
import Button from './Button.svelte';
import Editor from './Editor.svelte';
import List from './List.svelte';

let left = 165;
const top = '47';
const title = '-Route(s)-' 
const id = 'routeLeft';

onMount(async () => {
  console.warn('onMount route/index');
  chrome.storage.local.get(id, function(opt) {
    opt[id] && (left = opt[id])
  });
});

function dragend({detail}) {
  left = detail.left
  const data = {}
  data[id] = left
  chrome.storage.local.set(data)
}

let _timeout = null;
function onChange(e) {
  const { editor: { _route }} = window.mitm;
  let saveDisabled;
  if (e===false) {
    saveDisabled = true;
    source.update(n => {return {
      ...n,
      saveDisabled: true,
      editbuffer: _route.getValue()
    }})
  }
  _timeout && clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    if (_route){
      saveDisabled = (_route.getValue()===$source.editbuffer)
      source.update(n => {return {
        ...n,
        saveDisabled
      }});
      console.log(e);
    }
  }, 500)  
}
</script>

<Button/>
<VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>
  <Editor {onChange}/>
</VBox2>
