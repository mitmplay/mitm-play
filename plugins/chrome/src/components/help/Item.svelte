<script> // feat: markdown
import { source } from './stores.js';

export let item;
export let onChange;

function clickHandler(e) {
  let {item} = e.target.dataset;
  // const { editor: { _markdown, _markdownEdit }, files } = mitm;
  const obj = files.markdown[item];
  const url = item;
  console.log(item, obj);

  if (_markdown===undefined) {
    // _markdownEdit(obj.content);
  } else {
    // _markdown.setValue(obj.content || '');
    // _markdown.revealLine(1);
  }
  setTimeout(() => {
    onChange(false);

    source.update(n => {
      return {
        ...n,
        goDisabled: (url===undefined),
        // content: obj.content,
        fpath: obj.fpath,
        path: obj.path,
        item,
      }
    });
  }, 1);
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
