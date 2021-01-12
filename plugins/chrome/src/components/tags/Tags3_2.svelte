<script>
import { tags } from './stores.js';
import Tags33 from './Tags3_3.svelte';

export let items;
export let path;
export let ns;

function title(item) {
  return `${item.split(':')[0]}:`;
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
  let arr = Object.keys(typs);
  arr = arr.filter(x=>x[0]!==':')
  return arr;
}
function xtags() {
  let arr
  for (const id in items) {
    if (id.slice(0,1)!==':') {
      arr = Object.keys( items[id])
      break
    }
  }
  const map = arr.map(x => x.split(':').pop())
  return map.sort().join(' ')
}
</script>

{#each xitems($tags) as item}
  <details>
    <summary class="space2 {active(item)}">
      {title(item)}
      <span class="prop">{items[`:${item}`]}</span>
      <span class="tags">{`<${xtags($tags)}>`}</span>
    </summary>
    <Tags33 items={items[item]} {item} {path} {ns}/>
  </details>
{/each}

<style>
details summary .prop,
details[open] summary .tags {
  display: none;
}
details summary .tags,
details[open] summary .prop {
  font-family: Roboto;
  font-size: 11px;
  display: inline;
}
details summary .tags {
  margin-left: -5px;
  color: green;
}
details summary .prop {
  color: #dddddd
}
summary.space1,
summary.space2 {
  margin-bottom: 2px;
}
.space2 {
  padding-left: 12px;
  font-weight: bolder;
  color: green;
}
.atag {
  color: #dac5c5
}
.atag.slc {
  color: red;
  font-weight: bolder;
  background-color: beige;
}
</style>
