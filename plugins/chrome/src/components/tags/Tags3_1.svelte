<script>
import { tags } from './stores.js';
import Tags32 from './Tags3_2.svelte';
import  Expand from '../button/Expand.svelte';
import  Collapse from '../button/Collapse.svelte';

export let items;
export let ns;

let namespace;

function q(key) {
  return key.replace(/\./g, '-')
}
function btnExpand(e) {
  const node = e.target.parentElement
  setTimeout(() => {
    const exp = node.getAttribute('open')
    if (exp!==null) {
      const nodes = document.querySelectorAll(`#${node.id} details`)
      nodes.forEach(node => node.setAttribute('open', ''))
    }
  }, 0)
}
function xitems(tags) {
  const {__tag3} = tags;
  namespace = __tag3[ns];
  const arr = Object.keys(namespace).sort();
  return arr;
}
function xtags(path) {
  const { rclass } = window.mitm.fn;
  let secs = namespace[path];
  let arr = Object.keys(secs).filter(x=>x[0]!==':');
  const klass = arr.map(x=>
      Object.keys(secs[x]).
      map(x=>x.
        split(':').
        pop().
        replace(rclass, '-')
      ).
      join(' _')
    )
  return `_${klass.join(' _')}`;
}
</script>

<div class="border">
  <div class="space0">
    <Collapse name="state3" q="{`.t3.${q(ns)}`}"></Collapse>
    <Expand name="state3" q="{`.t3.${q(ns)}`}"></Expand>
    <span class="ns">[{ns==='_global_' ? ' * ' : ns}]</span>
  </div>
  <div class="t3 {q(ns)}">
    {#each xitems($tags) as path, i}
    <details id="path{i}">
      <summary on:click="{btnExpand}" class="space1 {xtags(path)}">{path}</summary>
      <Tags32 items={items[path]} {path} {ns}/>
    </details>
  {/each}

  </div>
</div>

<style>
.ns {
  margin-left: -3px;
  font-size: 15px;
}
.border {
  border: 1px solid;
}
.space0 {
  line-height: 1.5;
  font-size: medium;
  font-weight: bolder;
  color: darkblue;
  background: lightgrey;
}
.space1 {
  font-size: 13px;
  font-weight: bolder;
  color: blueviolet;
  padding-left: 3px;
}
</style>
