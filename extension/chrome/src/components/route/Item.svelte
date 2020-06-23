<script>
import { source } from './stores.js';
import { onMount } from 'svelte';

export let item;
export let onChanged;

function setupCodeMiror() {
  if (!window.editor) {
    window.editor = CodeMirror.fromTextArea(document.getElementById("demotext"), {
      lineNumbers: true,
      mode: "javascript",
      matchBrackets: true
    });
    editor.on('changes', onChanged);
    onChanged(false);
  }
}

onMount(async () => setupCodeMiror())

function clickHandler(e) {
  let {item} = e.target.dataset;
  const url = mitm.routes[item].url;
  const obj = window.mitm.files.route[item];
  console.log(item, obj);
  if (window.editor) {
    const nodes = document.querySelectorAll('#code-mirror .CodeMirror');
    nodes.forEach(element => element.remove());
    window.editor = undefined;
  }
  setTimeout(() => setupCodeMiror(), 100)
  source.update(n => {
    return {
      ...n,
      goDisabled: (url===undefined),
      content: obj.content,
      path: obj.path,
      item,
    }
  });
}
</script>

<tr class="tr">
  <td>
    <div class="td-item {$source.path===item.path}"
      data-item={item.element}
      on:click="{clickHandler}"
    >{item.title}</div>
  </td>
</tr>

<style>
.td-item:hover {
  background: greenyellow;
}
td {
  border: 1px solid #999;
}
.td-item,
.td-show {
  cursor: pointer;
  padding: 0.1rem;
}
.td-item.true {
  color: blue;
  font-weight: bolder;
  background: aliceblue;
}
</style>
