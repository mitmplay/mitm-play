<script>
import { onMount } from 'svelte';
import { source } from './stores.js';

import VBox2 from '../box/VBox2.svelte';
import title from './Title.svelte';
import Editor2 from './Editor2.svelte';
import Button from './Button.svelte';
import List from './List.svelte';

let left = 165;
const top = '47';
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
function onChange() {
  let saveDisabled;
  _timeout && clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    const { tab } = $source;
    const editor = window.mitm.editor[`_route${tab+1}`]
    if (editor){
      saveDisabled = (editor.getValue()===$source.content)
      source.update(n => {return {
        ...n,
        saveDisabled
      }});
    }
  }, 1)  
}
</script>

<Button/>
<VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>
  <Editor2 {onChange}  item={$source.item}/>
</VBox2>
