<script>
import { source } from './stores.js';

function setupCodeMiror() {
  if (!window.showcode) {
    window.showcode = CodeMirror.fromTextArea(document.getElementById("democode"), {
      matchBrackets: true,
      lineNumbers: true,
      mode: 'javascript',
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

<div id="show-code" data-dummy={getSource()}>
  <textarea id="democode">{codeMirror($source.content)}</textarea>
</div>

<style>
#show-code {
  font-size: 12px;
  height: calc(100vh - 31px);
  overflow: auto;
}
#democode {
  display: none;
}
</style>