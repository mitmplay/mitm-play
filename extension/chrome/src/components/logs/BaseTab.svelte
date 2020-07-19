<script>
import { onMount } from 'svelte';
import { logstore } from './stores.js';
import { Tab } from 'svelma';

onMount(async () => {
  const element = window.document.getElementById('monaco2');
  const editor =  window.monaco.editor.create(element, {
    language: $logstore.ext,
    minimap: {
      enabled: false,
    },
    value: $logstore.source,
  });

  var ro = new ResizeObserver(entries => {
    const {width: w, height: h} = entries[0].contentRect;
    editor.layout({width: w, height: h})
  });
  ro.observe(element);
});
</script>

<Tab label="Headers">
  <div class="show">
    <pre>{@html $logstore.headers}</pre>
  </div>  
</Tab>
<Tab label="Response">
  <div class="show">
    <pre>{@html $logstore.content}</pre>
  </div>
</Tab>
<Tab label="Monaco">
  <div class="view-container">
    <div id="monaco2">
    </div>
  </div>
  <!-- <div class="show">
    <pre>{@html $logstore.source}</pre>
  </div> -->
</Tab>

<style>
.show {
  font-size: 12px;
  height: calc(100vh - 55px);
  overflow: auto;
}
.show pre{
  padding: 0 0 0 5px;
}
.view-container {
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
