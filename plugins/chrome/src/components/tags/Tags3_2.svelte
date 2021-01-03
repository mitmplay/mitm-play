<script>
import { tags } from './stores.js';
import Tags33 from './Tags3_3.svelte';

export let items;
export let path;
export let ns;

function title(item) {
  const v = items[`:${item}`]
  return `${item.split(':')[0]}:${v}`
}
function active(item) {
  let enabled = $tags.__tag2[ns][item]===false ? false : true
  for (const id in items[item]) {
    if (items[item][id]===false) {
      enabled = false
      break
    }
  }
  return enabled ? 'atag slc' : 'atag';
}
function xitems(tags) {
  const {__tag3} = tags;
  const namespace = __tag3[ns];
  const typs = namespace[path];
  const arr = Object.keys(typs);
  return arr;
}
</script>

{#each xitems($tags).filter(x=>x[0]!==':') as item}
  <div class="space2 {active(item)}">{title(item)}</div>
  <Tags33 items={items[item]} {item} {path} {ns}/>
{/each}

<style>
.space2 {
  padding-left: 20px;
  font-weight: bolder;
  color: green;
}
.atag {
  font-style: italic;
  font-size: 15px;
  color: #dac5c5
}
.atag.slc {
  color: red;
  font-weight: bolder;
  background-color: beige;
}
</style>
