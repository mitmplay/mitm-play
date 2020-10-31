<script>
import { tags } from './stores.js';
import Tags33 from './Tags3_3.svelte';

export let items;
export let path;
export let ns;

function xitems(tags) {
  const {__tag3} = tags;
  const namespace = __tag3[ns];
  const typs = namespace[path];
  return Object.keys(typs);
}
</script>

{#each xitems($tags).filter(x=>x[0]!==':') as item}
  <div class="space2">{item}:{items[`:${item}`]}</div>
  <Tags33 items={items[item]} {item} {path} {ns}/>
{/each}

<style>
.space2 {
  padding-left: 20px;
  font-weight: bolder;
  color: green;
}
</style>
