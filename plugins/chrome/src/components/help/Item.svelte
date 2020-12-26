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
  // console.log(t.title)
  const string = t.title.replace(/\.md$/,'')
  const pre = string.match(/^([^a-zA-Z]+.|.)/)[0]
  const post = string.replace(pre,'').toLowerCase()
  return pre.toUpperCase() + post;
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
