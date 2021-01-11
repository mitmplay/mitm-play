<script>
import { tags } from './stores.js';
import Tags32 from './Tags3_2.svelte';
import  Expand from '../button/Expand.svelte';
import  Collapse from '../button/Collapse.svelte';

export let items;
export let ns;
let st = {
  collapse: true,
  expand: false
};
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
    <Collapse {st} q="{`.t3.${q(ns)}`}"></Collapse>
    <Expand {st} q="{`.t3.${q(ns)}`}"></Expand>
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
  font-size: 13px;
  font-weight: bolder;
  color: blueviolet;
  padding-left: 3px;
}
</style>
