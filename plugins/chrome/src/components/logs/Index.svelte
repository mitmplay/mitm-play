<script>
import { onMount } from 'svelte';
import { logstore } from './stores.js';

import VBox2 from '../box/VBox2.svelte';
import title from './Title.svelte';
import List from './List.svelte';
import Show from './Show.svelte';

let left = 163;
const top = '47';
const id = 'logsLeft';

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

<VBox2 {title} {top} {left} {dragend} {List} show={$logstore.logid}>
  <Show/>
</VBox2>
