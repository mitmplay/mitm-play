<script>
export let item; 
export let key;

import { logstore } from './stores.js';

function data(i) {
  const id = Object.keys(i)[0]
  const arr = i[id].path.split('/')
  arr.pop()
  return arr.join('/')
}

function clickHandler(e) {
  const node = e.currentTarget;
  const {parentNode:p} = node
  const {checked} = node;
  setTimeout(()=>{
    p.classList.remove(!checked)
    p.classList.add(checked)
  }, 0)
}

function klass(store) {
  for (const itm in item) {
    if (itm===store.logid) {
      return 'chk'
    }
  }
  return ''
}
</script>

<summary
  data-path={data(item)}
  class="{klass($logstore)}"
>
  <input on:click="{clickHandler}" type="checkbox" class="log-grp"/>
  {@html key}
</summary>

<style>
  summary.chk {
    font-weight: 700;
    background: #e6f7d9;
  }
  summary.true {
    background: #f3dddd;
  }
  summary:hover {
    background: #eae4f1;
  }
  input[type="checkbox"] {
    vertical-align: middle;
  }
</style>