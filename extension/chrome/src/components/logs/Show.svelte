<script>
export let element;
import { source } from './stores.js';

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
  if (window.showcode) {
    const nodes = document.querySelectorAll('#show-code .CodeMirror');
    nodes.forEach(element => element.remove());
    window.showcode = undefined;
  }
  setTimeout(() => setupCodeMiror(), 1)
  return code.replace(/"(.+)"(:)/g, replacer).
  replace(/ (resp|reqs|url)(\w+):/g, (m,p1,p2) => ` "${p1}${p2}":`);
}

let promise = getSource();

async function getSource() {
  const res = await fetch($source.url);
  const text = await res.text();

  if (res.ok) {
    return text;
  } else {
    throw new Error(text);
  }
}
</script>

<div>
  {#if $source.title.match('.png')}
    <img src="{$source.url}" alt="image"/>
  {:else if $source.title.match('.json')}
    <!-- <iframe title="json" src="{$source.url}" frameborder="0"></iframe> -->
    {#await promise}
      <p>...waiting</p>
    {:then source}
      <div id="show-code">
        <textarea id="democode">{codeMirror(source)}</textarea>
      </div>
    {:catch error}
      <p style="color: red">{error.message}</p>
    {/await}

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
</style>