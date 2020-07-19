<script>
import { onMount } from 'svelte';
import { logstore } from './stores.js';
import { Tab } from 'svelma';

const minimap = {enabled: false};

onMount(async () => {
  console.log($logstore)
  const element1 = window.document.getElementById('monaco1');
  const editor1 =  window.monaco.editor.create(element1, {
    value: $logstore.headers,
    language: 'json',
    minimap
  });

  var ro1 = new ResizeObserver(entries => {
    const {width, height} = entries[0].contentRect
    editor1.layout({width, height})
  });
  ro1.observe(element1);

  const element2 = window.document.getElementById('monaco2');
  const editor2 =  window.monaco.editor.create(element2, {
    language: $logstore.ext,
    value: $logstore.source,
    minimap
  });

  var ro2 = new ResizeObserver(entries => {
    const {width, height} = entries[0].contentRect
    editor2.layout({width, height})
  });
  ro2.observe(element2);
});
</script>

<Tab label="Headers">
  <div class="view-container">
    <div id="monaco1">
    </div>
  </div>
</Tab>
<Tab label="Response">
  <div class="view-container">
    <div id="monaco2">
    </div>
  </div>
</Tab>

<style>
.view-container {
  position: relative;
  height: calc(100vh - 50px);
}
#monaco1,
#monaco2 {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
</style>
