<script>
import { onMount } from 'svelte';

import Button from './Button.svelte';
import VBox2 from '../box/VBox2.svelte';
import View from './View.svelte';
import List from './List.svelte';

let left = 150;
const title = '-Help-';
const id  = 'helpLeft';

onMount(async () => {
  console.warn('onMount help/index');
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
</script>

<Button/>
<VBox2 {title} {left} {dragend} {List}>
  <View/>
</VBox2>
