<script>
import { tags } from './stores.js';

export let items;
export let ns;

function clicked(e) {
  const {__tag1,__tag2,__tag3} = $tags;
  const {item} = e.target.dataset;
  const typ1 = item.split(':')[1] || item;
  const [group1, id1] = typ1.split('~');
  const namespace = __tag2[ns];
  const tagx = {};
  for (let itm in namespace) {
    tagx[itm] = namespace[itm]
  }
  setTimeout(()=>{
    const flag =namespace[item];
    console.log('e', {__tag2,__tag3});

    if (id1) {
      for (let itm in namespace) {
        const typ2 = itm.split(':')[1] || itm;
        const [group2, id2] = typ2.split('~');
        if (!(tagx && tagx[item])) {
          if (group1===group2 && id1!==id2) {
            namespace[itm] = !flag;
          }
        }
      }
    }

    const urls = __tag3[ns];
    for (let url in urls) {
      const typs = urls[url];
      for (let typ in typs) {
        const namespace3 = typs[typ];
        for (let itm in namespace3) {
          if (item===itm) {
            namespace3[itm] = flag;
          }
          if (group1===itm.split('~')[0]) {
            namespace3[itm] = namespace[itm] || false;
          }
        }
      }
    }
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

const sort = (a,b) => {
  const [k1,v1] = a.split(':');
  const [k2,v2] = b.split(':');
  a = v1 || k1;
  b = v2 || k2;
  if (a<b) return -1;
  if (a>b) return 1;
  return 0;
}

function itemlist(items) {
  let arr = Object.keys(items);
  if ($tags.uniq) {
    arr = arr.filter(x => x.match(':'))
  }
  return arr.sort(sort);
}

function routetag(item) {
  if (item.match(':')) {
    return items[item] ? 'rtag slc' : 'rtag';
  } else {
    return items[item] ? 'stag slc' : '';
  }
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
    {#if !item.match('url:')}
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
.space1 span {
  font-size: 15px;
  vertical-align: 15%;
}
.space1 .big {
  margin-left: -2px;
}
.rtag {
  color: cadetblue;
  font-size: medium;
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
