<script>
import { tags } from './stores.js';
import Tags32 from './Tags3_2.svelte';

export let items;
export let ns;

function xitems(tags) {
  const {__tag3} = tags;
  const namespace = __tag3[ns];
  return Object.keys(namespace);
}
</script>

<div class="border">
  <div class="space0">[{ns==='_global_' ? ' * ' : ns}]</div>
  {#each xitems($tags) as path}
    <div class="space1">{path}</div>
    <Tags32 items={items[path]} {path} {ns}/>
  {/each}
</div>

<style>
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
  padding-left: 10px;
  font-weight: bolder;
  color: blueviolet
}
</style>
