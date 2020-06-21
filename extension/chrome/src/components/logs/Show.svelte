<script>
let sourceCode = '';

import { source } from './storesp.js';

function setupCodeMiror() {
  if (!window.showcode) {
    window.showcode = CodeMirror.fromTextArea(document.getElementById("democode"), {
      lineNumbers: true,
      mode: "javascript",
      matchBrackets: true
    });
  }
}
function replacer(match, p1, p2) {
  return [p1, p2].join('');
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
  setTimeout(() => setupCodeMiror(), 1)
  return code.replace(/"(.+)"(:)/g, replacer).
  replace(/ (resp|reqs|url)(\w+):/g, (m,p1,p2) => ` "${p1}${p2}":`);
}

async function getSource() {
  const resp = await fetch($source.url);
  const text = await resp.text();

  if (resp.ok) {
    sourceCode = text;
    console.log('Fetch success')
  } else {
    console.log('Fetch Errir', resp.status)
  }
  return Math.random()+'';
}

</script>

<div>
  {#if $source.title.match('.png')}
    <img src="{$source.url}" alt="image"/>
  {:else if $source.title.match('.json')}
    <div id="show-code">
      <textarea id="democode">{codeMirror(sourceCode)}</textarea>
    </div>
  {:else}
    <button>X</button>
  {/if}
</div>

<style>
#show-code {
  font-size: 12px;
  height: calc(100vh - 31px);
  width: calc(100vw - 163px);
  overflow: auto;
}
#democode {
  display: none;
}
</style>