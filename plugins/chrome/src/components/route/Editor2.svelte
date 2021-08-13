<script>
import { source } from './stores.js';
import { cfg, resize } from '../monaco/init';
import { Tabs, Tab } from 'svelma';
import { onMount } from 'svelte';
const _c = 'color: blueviolet'

export let onChange;
export let item;

let node1;
let node2;

let edit1;
let edit2;

onMount(async () => {
  window.mitm.monaco.router2 = monacoNS => {
    node1 = window.document.getElementById('_route1');
    node2 = window.document.getElementById('_route2');
    
    edit1 =  window.monaco.editor.create(node1, cfg);
    edit2 =  window.monaco.editor.create(node2, cfg);
    edit1.onDidChangeModelContent(onChange);
    edit2.onDidChangeModelContent(onChange);
    window.mitm.editor._route1 = edit1;
    window.mitm.editor._route2 = edit2;

    const ro1 = new ResizeObserver(resize(edit1));
    const ro2 = new ResizeObserver(resize(edit2));

    ro1.observe(node1);
    ro2.observe(node2);

    console.log('%cRoute: Editor2 initilized!', _c)
    const nodes = document.querySelectorAll('.tab-route a');
    for (let [i,node] of nodes.entries()) {
      node.onclick = function(e) {
        const id = i===0 ? item : `${item}/macros`;
        const { routes, files } = mitm;
        const url = routes[item].url;
        const obj = files.route[id];
        source.set({
          ...$source,
          goDisabled: (url===undefined),
          content: obj.content,
          fpath: obj.fpath,
          path: obj.path,
          item,
          tab: i,
        });
        setTimeout(onChange,1)
      }
    }
  }
});

function reload(item) {
  if (edit1) {
    console.log('%cRoute: Editor2 reload', _c, item)
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

<Tabs value={$source.tab} style="is-boxed tab-route" size="is-small">
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
