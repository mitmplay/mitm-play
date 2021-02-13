<script>
import { source, tabstore } from './stores.js';

export let item;
export let group = '';
export let onChange;

function clickHandler(e) {
  e.preventDefault()
  e.stopPropagation()
  let {element} = e.target.dataset;
  const { routes, files } = mitm;
  const url = routes[element].url;
  const obj = files.route[element];
  // console.log(item, element, obj);

  setTimeout(() => {
    onChange(false);

    source.update(n => {
      return {
        ...n,
        goDisabled: (url===undefined),
        content: obj.content,
        fpath: obj.fpath,
        path: obj.path,
        item: element,
        macro: files.route[`${element}/macros`]!==undefined
      }
    }, 1);
  })
}
</script>

<div class="td-item {group} {$source.fpath===item.fpath}"
  data-element={item.element}
  on:click="{clickHandler}"
>{item.title}</div>

<style>
.td-item {
  cursor: pointer;
  padding: 0.1rem;
  line-height: 15px;
  padding-left: 10px;
  border-bottom: 1px solid #c0d8cca1;
}
.td-item.true {
  color: blue;
  font-weight: bolder;
  background: greenyellow;
  border-bottom: 1px solid #3638bfa1;
}
div.child {
  border: none;
  padding-left: 12px;
  background: beige;
}
div.group {
  border: none;
  padding: 0;
  margin-left: 9px;
  margin-top: -15px;
}
</style>
