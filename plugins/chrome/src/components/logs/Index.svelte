<script>
import { onMount } from 'svelte';
import { logstore } from './stores.js';

import VBox2 from '../box/VBox2.svelte';
import title from './Title.svelte';
import List from './List.svelte';
import Show from './Show.svelte';

let left = 163;
let height='47';

onMount(async () => {
  chrome.storage.local.get('logsLeft', function(opt) {
    opt.routeLeft && (left = opt.routeLeft)
  });
});

function dragend({detail}) {
  chrome.storage.local.set({logsLeft: detail.left})
}
</script>

<VBox2 {title} {left} {height} {dragend} {List} show={$logstore.logid}>
  <Show/>
</VBox2>
