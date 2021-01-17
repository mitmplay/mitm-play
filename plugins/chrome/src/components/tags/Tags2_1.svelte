<script>
import { tags } from './stores.js';
import Expand from '../button/Expand.svelte';
import Collapse from '../button/Collapse.svelte';

export let items;
export let ns;

function clicked(e) {
  const { resetRule2, resetRule3 } = window.mitm.fn;
  const {__tag1,__tag2,__tag3} = $tags;
  const {item} = e.target.dataset;
  const namespace = __tag2[ns];
  const tagx = {};
  for (let itm in namespace) {
    tagx[itm] = namespace[itm]
  }
  setTimeout(()=>{
    console.log('e', {__tag2,__tag3});
    resetRule2($tags, item, ns, tagx)
    resetRule3($tags, item, ns)
    const {filterUrl, tgroup, uniq} = $tags;
    tags.set({
      filterUrl,
      __tag1,
      __tag2,
      __tag3,
      tgroup,
      uniq
    })
  }, 10);
}

function itemlist(items) {
  const {fn: {sortTag}} = window.mitm;
  let arr = Object.keys(items);
  if ($tags.uniq) {
    arr = arr.filter(x => x.match(':')).filter(x => !x.match('url:'))
  }
  return arr.sort(sortTag);
}

function routetag(item) {
  const {__tag1, __tag2} = window.mitm
  const tags = __tag2[ns][item].tags || [] // feat: update __tag2

  let klas
  if (item.match(':')) {
    klas = items[item].state ? 'rtag slc' : 'rtag'; // feat: update __tag2
  } else {
    klas = items[item].state ? 'stag slc' : ''; // feat: update __tag2
  }
  if (item.match('url:')) {
    klas += ' url'
  }
  for (const tag of tags) {
    if (__tag1[tag]===false) {
      klas += ' grey'
      break
    }
  }
  return klas
}

function show(item) {
  const [k,v] = item.split(':');
  if (v===undefined) return k;
  return `${v}{${k}}`;
}
function linkTags(item) {
  const {tags} = window.mitm.__tag2[ns][item] // feat: update __tag2
  const linkTags = tags && tags.length ? `[${tags.join(',')}]` : ''
  return linkTags;
}
function isGroup(item) {
  return window.mitm.__tag2[ns][item] // feat: update __tag2
}
function urllist(_tags, item) {
  const {__tag2, fn: { noTagInRule, uniq }} = window.mitm;
  const {tags} = __tag2[ns][item] // feat: update __tag2
  if (tags && tags.length) {
    item = `${item} ${tags.join(' ')}`
  }
  let obj = window.mitm.routes[ns][item]
  if (obj===undefined) {
    obj = []
  } else if (!Array.isArray(obj)) {
    obj = Object.keys(obj)
  }
  obj = obj.map(noTagInRule).filter(uniq)
  return obj
}
function spacex(tags, item, path) {
  let klass = items[item].state ? 'slc' : ''; // feat: update __tag2
  const { rclass, isRuleOff, tagsIn__tag3 } = window.mitm.fn;
  isRuleOff(tags, ns, path) && (klass += ' grey');
  const tag = tagsIn__tag3(tags, ns, path, item).join(' _')
  if (tag) {
    klass += ` _${tag}`
  }
  return `${klass} _${item.split(':')[1].replace(rclass, '-')}`
}
function q(key) {
  return key.replace(/\./g, '-')
}
</script>

{#if Object.keys(items).length}
<div class="border">
  <div class="space0">
    <Collapse on:message name="state2" q="{`.t2.${q(ns)}`}"></Collapse>
    <Expand on:message name="state2" q="{`.t2.${q(ns)}`}"></Expand>
    <span class="ns">[{ns==='_global_' ? ' * ' : ns}]</span>
  </div>
  {#each itemlist(items) as item}
    <div class="t2 {q(ns)}">
    {#if isGroup(item)}
      <details>
        <summary class="space1 {routetag(item)}">
          <label>
            <input type="checkbox"
            data-item={item}
            on:click={clicked} 
            bind:checked={items[item].state}/> <!-- // feat: update __tag2 -->
            <span class="{item.match(':') ? 'big' : ''}">{show(item)}</span>
            <span class="link-tags">{linkTags(item)}</span>
          </label> 
        </summary>
        {#each urllist($tags, item) as path}
          <div class="spacex {spacex($tags, item, path)}">{path}</div>
        {/each}
      </details>
    {:else}
      <div class="space1 {routetag(item)}">
        <label>
          <input type="checkbox"
          data-item={item}
          on:click={clicked} 
          bind:checked={items[item].state}/> <!-- // feat: update __tag2 -->
          <span class="{item.match(':') ? 'big' : ''}">{show(item)}</span>
          <span class="link-tags">{linkTags(item)}</span>
        </label>
      </div>
    {/if}
    </div>
  {/each}
</div>
{/if}

<style>
.ns {
  margin-left: -3px;
  font-size: 15px;
}
.border {
  border: 1px grey solid;
}
summary label {
  display: inline;
  margin-left: -2px;
}
summary.space1 {
  padding-left: 5px;
}
.link-tags {
  font-style: italic;
  margin-left: -8px;
  font-size: 10px;
  vertical-align: 31%;
  color: darkmagenta;
}
.grey .link-tags {
  color: gray;
  font-weight: 100;
}
.space0 {
  line-height: 1.5;
  font-size: medium;
  font-weight: bolder;
  color: darkblue;
  background: lightgrey;
}
.space1 {
  color: grey;
  padding-left: 17px;
}
.space1 span {
  font-size: 13px;
  vertical-align: 15%;
}
.space1 .big {
  margin-left: -2px;
}
.spacex {
  padding-left: 30px;
  color: #ecd7d7;
  font-size: 12px;
  font-family: monospace;
}
.space1.rtag.grey {
  color: #d18a8a;
}
.spacex.slc {
  color: blueviolet;
}
.spacex.grey {
  color: #ecd7d7;
}
.rtag {
  font-size: 13px;
  color: cadetblue;
  background-color: beige;
}
.rtag.url {
  background-color: inherit;
}
.rtag.slc {
  color: red;
  font-weight: bolder;
}
.rtag.slc.url {
  color: #c36e01;
  font-weight: bolder;
}
.stag.slc {
  color: green;
  font-weight: bolder;
}
</style>
