<script> // feat: markdown
import { source } from './stores.js';

export let item;

function clickHandler(e) {
  console.log(item);
  const {fpath} = item;
  ws__send('getMContent', {fpath}, ({content}) => {
    source.update(n => {
      return {
        ...n,
        content,
        fpath: item.fpath
      }
    })
  });
}

function title(t) {
  const string = t.title.split('.')[0].toLowerCase()
  return string.charAt(0).toUpperCase() + string.slice(1);
}
</script>

<div class="td-item {$source.fpath===item.fpath}"
  data-item={item.element}
  on:click="{clickHandler}"
>{title(item)}</div>

<style>
.td-item:hover {
  color: blue;
  font-weight: bolder;
}
.td-item,
.td-show {
  cursor: pointer;
  padding: 0.1rem;
  line-height: 15px;
  padding-left: 12px;
}
.td-item.true {
  color: blue;
  font-weight: bolder;
  background: greenyellow;
}
</style>
