<script> // feat: profile
import { onMount } from 'svelte';
import { source } from './stores.js';

import VBox2 from '../box/VBox2.svelte';
import Button from './Button.svelte';
import Editor from './Editor.svelte';
import List from './List.svelte';

let left = 165;
const height = '47';
const title = '-Profile(s)-' 
const id = 'profileLeft';

onMount(async () => {
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
  const { editor: { _profile }} = window.mitm;
  let saveDisabled;
  if (e===false) {
    source.update(n => {return {
      ...n,
      saveDisabled: true,
      editbuffer: _profile.getValue()
    }})
    
  }
  _timeout && clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    if (_profile){
      saveDisabled = (_profile.getValue()===$source.editbuffer)
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
<VBox2 {title} {left} {height} {dragend} {List} props={{onChange}}>
  <Editor {onChange}/>
</VBox2>
