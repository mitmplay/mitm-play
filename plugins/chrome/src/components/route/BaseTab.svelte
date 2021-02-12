<script>
import { source, tabstore } from './stores.js';
import { cfg, resize } from '../monaco/init';
import { Tabs, Tab } from 'svelma';
import { onMount } from 'svelte';

const option = {
  ...cfg,
  readOnly: true,
  contextmenu: false,
}

let node1;
let node2;

let edit1;
let edit2;

onMount(async () => {
  console.warn('onMount logs - BaseTab.svelte');
  console.log($source)
  const val1 = {
    ...option,
    language: 'js',
    value: $source.headers,
  };
  const val2 = {
    ...option,
    language: 'js',
    value: $source.response,
  };

  node1 = window.document.getElementById('_route1');
  node2 = window.document.getElementById('_route2');
  
  edit1 =  window.monaco.editor.create(node1, val1);
  edit2 =  window.monaco.editor.create(node2, val2);

  console.log('load monaco: route 1,2')
  const ro1 = new ResizeObserver(resize(edit1));
  const ro2 = new ResizeObserver(resize(edit2));


  ro1.observe(node1);
  ro2.observe(node2);

  tabstore.set({
    ...$tabstore,
      editor: {
        edit1,
        edit2,
      },
  })
});
</script>

<Tabs value={$tabstore.tab} style="is-boxed tab-html" size="is-small">
  <Tab label="Headers">
    <div class="view-container">
      <div id="_route1">
      </div>
    </div>
  </Tab>
  <Tab label="Response">
    <div class="view-container">
      <div id="_route2">
      </div>
    </div>
  </Tab>
</Tabs>

<style>
.view-container {
  position: relative;
  height: calc(100vh - 50px);
}
#_route1,
#_route2 {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
</style>
