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
function title(item) {
  const v = items[`:${item}`]
  return `${item.split(':')[0]}:${v}`
}
function check(item) {
  return $tags.__tag2[ns][item]
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
function routetag(item) {
  return $tags.__tag2[ns][item] ? 'rtag slc' : 'rtag';
}
</script>

{#each xitems($tags).filter(x=>x[0]!==':') as item}
  <div class="space2 {active(item)}">{title(item)}</div>
  {#if check(item)!==undefined}
    <div class="space3 {routetag(item)} r2">
      <input type="checkbox" bind:checked={$tags.__tag2[ns][item]} disabled/>
      <span>{item.split(':')[1]}</span>
    </div>
  {/if}
  <Tags33 items={items[item]} {item} {path} {ns}/>
{/each}

<style>
.space2 {
  padding-left: 20px;
  font-weight: bolder;
  color: green;
}
.space3 {
  padding-left: 20px;
}
.space3 span {
  vertical-align: 15%;
}
.atag {
  font-style: italic;
  font-size: 15px;
  color: grey;
}
.atag.slc {
  color: red;
  font-weight: bolder;
}
.rtag {
  color: cadetblue;
  font-size: medium;
  background-color: beige;
}
.rtag.slc {
  color: #5dac75;
  font-weight: bolder;
}
.rtag.r2 {
  font-size: 13px;
}
.rtag.slc.r2 {
  color: #da8181;
}
</style>
