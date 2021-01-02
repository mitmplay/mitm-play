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
function title2(item) {
  const [r, t] = item.split(':')
  return `${t}{${r}}`
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
function xitems(tags) {
  const {__tag3} = tags;
  const namespace = __tag3[ns];
  const typs = namespace[path];
  const arr = Object.keys(typs);
  return arr;
}
function zitems(item) {
  let obj = {};
  const ob2 = check(item)
  if (ob2!==undefined) {
    obj[item] = ob2
    obj = {...obj , ...items[item]}
  } else {
    obj = {...items[item]}
  }
  return obj
}
</script>

{#each xitems($tags).filter(x=>x[0]!==':') as item}
  <div class="space2 {active(item)}">{title(item)}</div>
  <Tags33 items={zitems(item)} {item} {path} {ns}/>
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
  /* background-color: beige; */
}
.rtag.slc {
  color: #5dac75;
  font-weight: bolder;
}
</style>
