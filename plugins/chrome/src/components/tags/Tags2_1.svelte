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
.rtag.url {
  background-color: inherit;
}
.rtag.slc {
  color: red;
  font-weight: bolder;
}
.rtag.slc.url {
  color: #c36e01;
}
.stag.slc {
  color: green;
  font-weight: bolder;
}
</style>
