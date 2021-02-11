<script>
import { logstore, tabstore } from './stores.js';
import { cfg, resize } from '../monaco/init';
import { onMount } from 'svelte';
import { Tab } from 'svelma';

const option = {
  ...cfg,
  readOnly: true,
  contextmenu: false,
}

let node1;
let node2;
let node3;

let edit1;
let edit2;
let edit3;

onMount(async () => {
  console.warn('onMount logs - BaseTab.svelte');
  console.log($logstore)
  const ext = $logstore.ext==='js' ? 'javascript' : $logstore.ext
  const hdrs = JSON.parse($logstore.headers);
  const csp3 = hdrs.CSP || {};
  const val1 = {
    ...option,
    language: 'json',
    value: $logstore.headers,
  };
  const val2 = {
    ...option,
    language: ext,
    value: $logstore.response,
  };
  const val3 = {
    ...option,
    language: 'json',
    value: JSON.stringify(csp3, null, 2),
  };
  const ctype = $logstore.respHeader["content-type"] || 'text/plain';
  if (ctype.match('html')) {
    val2.value = val2.value.
    replace(/\\n\\n/g, '').
    replace(/\\n/g, '\n').
    replace(/\\t/g, '\t').
    replace(/\\"/g, '"').
    replace(/^"/, '').
    replace(/"$/, '');
    val2.language = 'html';
  }

  node1 = window.document.getElementById('monaco1');
  node2 = window.document.getElementById('monaco2');
  node3 = window.document.getElementById('monaco3');

  edit1 =  window.monaco.editor.create(node1, val1);
  edit2 =  window.monaco.editor.create(node2, val2);
  edit3 =  window.monaco.editor.create(node3, val3);

  console.log('load monaco: logs 1,2,3')
  const ro1 = new ResizeObserver(resize(edit1));
  const ro2 = new ResizeObserver(resize(edit2));
  const ro3 = new ResizeObserver(resize(edit3));

  ro1.observe(node1);
  ro2.observe(node2);
  ro3.observe(node3);

  tabstore.set({
    ...$tabstore,
      editor: {
        edit1,
        edit2,
        edit3,
      },
  })
});
function isCSP() {
  const h = $logstore.respHeader;
  const csp = h['content-security-policy'] || h['content-security-policy-report-only'];
  return csp;
}
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
<Tab label="CSP">
  <div class="view-container">
    <div id="monaco3">
  </div>
</Tab>

<style>
.view-container {
  position: relative;
  height: calc(100vh - 50px);
}
#monaco1,
#monaco2,
#monaco3 {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
</style>
