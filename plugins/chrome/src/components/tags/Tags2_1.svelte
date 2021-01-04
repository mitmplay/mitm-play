<script>
import { tags } from './stores.js';

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
  let klas
  if (item.match(':')) {
    klas = items[item] ? 'rtag slc' : 'rtag';
  } else {
    klas = items[item] ? 'stag slc' : '';
  }
  if (item.match('url:')) {
    klas += ' url'
  }
  return klas
}

function show(item) {
  const [k,v] = item.split(':');
  if (v===undefined) return k;
  return `${v}{${k}}`;
}
function isGroup(item) {
  return window.mitm.routes[ns][item]
}
function urllist(tags, item) {
  const obj = window.mitm.routes[ns][item]
  if (Array.isArray(obj)) {
    return obj
  } else if (obj) {
    return Object.keys(obj)
  }
  return []
}
function spacex(tags, item, url) {
  const { isRuleOff } = window.mitm.fn;
  let klass = items[item] ? 'slc' : '';
  isRuleOff(tags, ns, url) && (klass += ' grey');
  return klass
}
</script>

<div class="border">
  <div class="space0">[{ns==='_global_' ? ' * ' : ns}]</div>
  {#each itemlist(items) as item}
    {#if isGroup(item)}
      <details>
        <summary class="space1 {routetag(item)}">
          <label>
            <input type="checkbox"
            data-item={item}
            on:click={clicked} 
            bind:checked={items[item]}/>
            <span class="{item.match(':') ? 'big' : ''}">{show(item)}</span>
          </label> 
        </summary>
        {#each urllist($tags, item) as url}
          <div class="spacex {spacex($tags, item, url)}">{url}</div>
        {/each}
      </details>
    {:else}
      <div class="space1 {routetag(item)}">
        <label>
          <input type="checkbox"
          data-item={item}
          on:click={clicked} 
          bind:checked={items[item]}/>
          <span class="{item.match(':') ? 'big' : ''}">{show(item)}</span>
        </label>
      </div>
    {/if}
{/each}
</div>

<style>
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
.space0 {
  line-height: 1.5;
  font-size: medium;
  font-weight: bolder;
  color: darkblue;
  background: lightgrey;
}
.space1 {
  color: grey;
  padding-left: 12px;
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
  color: grey;
  font-size: 13px;
  font-family: monospace;
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
