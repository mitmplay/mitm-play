<script>
import { tags } from './stores.js';

export let items;
export let ns;

function clicked(e) {
  setTimeout(()=>{
    const {__tag1,__tag2,__tag3} = $tags;
    const {item} = e.target.dataset;
    const flag = __tag2[ns][item];
    console.log('e', flag);

    const urls = __tag3[ns];
    for (let url in urls) {
      const typs = urls[url];
      for (let typ in typs) {
        const namespace = typs[typ];
        for (let itm in namespace) {
          if (item===itm) {
            namespace[itm] = flag;
          }
        }
      }
    }
    const {filterUrl} = $tags;
    tags.set({
      filterUrl,
      __tag1,
      __tag2,
      __tag3,
    })
  }, 10);
}

function routetag(item) {
  if (item.match(':')) {
    return items[item] ? 'rtag slc' : 'rtag';
  } else {
    return items[item] ? 'stag slc' : '';
  }
}

function itemlist(items) {
  const arr = Object.keys(items).sort((a,b) => {
    const [k1,v1] = a.split(':');
    const [k2,v2] = b.split(':');
    a = v1 || k1;
    b = v2 || k2;
    if (a<b) return -1;
    if (a>b) return 1;
    return 0;
  });
  return arr;
}

function show(item) {
  const [k,v] = item.split(':');
  if (v===undefined) return k;
  return `${v}{${k}}`;
}
</script>

<div class="border">
  <div class="space0">[{ns==='_global_' ? ' * ' : ns}]</div>
  {#each itemlist(items) as item}
    <div class="space1 {routetag(item)}">
      <label>
        <input type="checkbox"
        data-item={item}
        on:click={clicked} 
        bind:checked={items[item]}/>
        <span class="{item.match(':') ? 'big' : ''}">{show(item)}</span>
      </label>
    </div>
  {/each}
</div>

<style>
.border {
  border: 1px grey solid;
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
  padding-left: 10px;
}
.space1 .big {
  margin-left: -4px;
}
.rtag {
  color: cadetblue;
  font-size: medium;
  font-style: italic;
  background-color: beige;
}
.rtag.slc {
  color: red;
  font-weight: bolder;
}
.stag.slc {
  color: green;
  font-weight: bolder;
}
</style>
