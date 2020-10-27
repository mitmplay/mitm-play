<script> // feat: profile
import { source } from './stores.js';
import { onMount } from 'svelte';

export let item;
export let onChange;

onMount(async () => {});

function clickHandler(e) {
  let {item} = e.target.dataset;
  const url = item;
  const obj = window.mitm.files.profile[item];
  console.log(item, obj);

  window.monacoEditor2.setValue(obj.content);
  window.monacoEditor2.revealLine(1);
  onChange(false);

  source.update(n => {
    return {
      ...n,
      goDisabled: (url===undefined),
      content: obj.content,
      fpath: obj.fpath,
      path: obj.path,
      item,
    }
  });
}
</script>

<tr class="tr">
  <td>
    <div class="td-item {$source.fpath===item.fpath}"
      data-item={item.element}
      on:click="{clickHandler}"
    >{item.title}</div>
  </td>
</tr>

<style>
.td-item:hover {
  color: blue;
  font-weight: bolder;
}
td {
  border-bottom: 3px solid #c0d8cca1;
}
.td-item,
.td-show {
  cursor: pointer;
  padding: 0.1rem;
  line-height: 15px;
  padding-left: 5px;  
}
.td-item.true {
  color: blue;
  font-weight: bolder;
  background: greenyellow;
}
</style>
