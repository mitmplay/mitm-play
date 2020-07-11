<script>
import { source } from './stores.js';
import { Tabs, Tab, Button } from 'svelma';

function setupCodeMiror() {
  if (!window.showcode) {
    window.showcode = CodeMirror.fromTextArea(document.getElementById("democode"), {
      matchBrackets: true,
      lineNumbers: true,
      mode: 'html',
    });
  }
}
function codeMirror(code) {
  if (!code) {
    return '';
  }
  if (window.showcode) {
    const nodes = document.querySelectorAll('#show-code .CodeMirror');
    nodes.forEach(element => element.remove());
    window.showcode = undefined;
  }
  setTimeout(() => setupCodeMiror(), 1);
  return code.replace(/   "(.+)"(:)/g, (m,p1,p2) =>  `   '${p1}':`).
              replace(  / "(.+)"(:)/g, (m,p1,p2) =>  ` \`${p1}\`:`);
}

async function getSource() {
  const resp = await fetch($source.url);
  const content = await resp.text();

  if (resp.ok) {
    source.set({
      ...$source,
      content,
    });
    console.log('Fetch success', $source.content)
  } else {
    console.log('Fetch Errir', resp.status)
  }
  return Math.random()+'';
}

</script>

<Tabs style="is-boxed" size="is-small">
  <Tab label="Html">
    <div id="show-html" data-dummy={getSource()}>
      <textarea id="democode">{codeMirror($source.content)}</textarea>
    </div>  
  </Tab>
  <Tab label="Meta">Meta...</Tab>
</Tabs>

<style>
#show-html {
  font-size: 12px;
  height: calc(100vh - 55px);
  overflow: auto;
}
#democode {
  display: none;
}
</style>