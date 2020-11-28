<script>
import { onMount } from 'svelte';
import { source } from './stores.js';

import VBox2 from '../box/VBox2.svelte';
import Content from './Content.svelte';
import List from './List.svelte';

let rerender = 0;
let left = 165;
let data = [];
const title = '-Help-';
const id  = 'helpLeft';

$: _data = data;

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
</script>

<VBox2 {title} {left} {dragend} {List}>
  <Content/>
</VBox2>
