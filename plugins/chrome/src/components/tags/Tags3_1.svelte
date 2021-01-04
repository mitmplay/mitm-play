<script>
import { tags } from './stores.js';
import Tags32 from './Tags3_2.svelte';
import  Collapse from '../button/Collapse.svelte';
import  Expand from '../button/Expand.svelte';

export let items;
export let ns;

function xitems(tags) {
  const {__tag3} = tags;
  const namespace = __tag3[ns];
  return Object.keys(namespace);
}
function q(key) {
  return key.replace(/\./g, '-')
}
</script>

<div class="border">
  <div class="space0">
    <Collapse q="{`.t3.${q(ns)}`}"></Collapse>
    <Expand q="{`.t3.${q(ns)}`}"></Expand>
    <span class="ns">[{ns==='_global_' ? ' * ' : ns}]</span>
  </div>
  {#each xitems($tags) as path}
    <div class="t3 {q(ns)}">
      <div class="space1">{path}</div>
      <Tags32 items={items[path]} {path} {ns}/>
    </div>
  {/each}
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
  font-size: 15px;
  font-weight: bolder;
  color: blueviolet;
  padding-left: 3px;
}
</style>
