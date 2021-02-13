<script>
import { source, tabstore } from './stores.js';
import { cfg, resize } from '../monaco/init';
import { Tabs, Tab } from 'svelma';
import { onMount } from 'svelte';

export let onChange;
export let item;

let node1;
let node2;

let edit1;
let edit2;

function onChange1() {onChange(edit1, ...arguments)}
function onChange2() {onChange(edit2, ...arguments)}

onMount(async () => {
  window.mitm.monaco.router2 = monacoNS => {
    node1 = window.document.getElementById('_route1');
    node2 = window.document.getElementById('_route2');
    
    edit1 =  window.monaco.editor.create(node1, cfg);
    edit2 =  window.monaco.editor.create(node2, cfg);
    edit1.onDidChangeModelContent(onChange1);
    edit2.onDidChangeModelContent(onChange2);

    const ro1 = new ResizeObserver(resize(edit1));
    const ro2 = new ResizeObserver(resize(edit2));

    ro1.observe(node1);
    ro2.observe(node2);

    tabstore.set({
      ...$tabstore,
        editor: {
          ...$tabstore.editor,
          edit1,
          edit2,
        },
    })
    console.log('monaco route2 initilized!')
    const nodes = document.querySelectorAll('.tab-route a');
    for (let [i,node] of nodes.entries()) {
      node.onclick = function(e) {
        source.set({
          ...$source,
          tab: i+1,
        });
      }
    }
  }
});

function reload(item) {
  if (edit1) {
    console.log('Editor2', item)
    const { route } = mitm.files;
    edit1.setValue(route[item].content);
    edit1.revealLine(1);
    if (route[`${item}/macros`]) {
      edit2.setValue(route[`${item}/macros`].content);
      edit2.revealLine(1);
    }
  }
  return ''
}
</script>

<Tabs value={$tabstore.tab} style="is-boxed tab-route" size="is-small">
  <Tab label="Route">
    <div class="view-container">
      <div id="_route1">
      </div>
    </div>
  </Tab>
  <Tab label="Macros">
    <div class="view-container {$source.macro ? 'show' : 'hide'}">
      <div id="_route2">
      </div>
    </div>
  </Tab>
</Tabs>
{reload(item)}

<style>
.hide {
  display: none;
}
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
