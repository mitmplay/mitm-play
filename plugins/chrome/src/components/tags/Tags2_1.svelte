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
</script>

<div class="border">
  <div class="space0">[{ns}]</div>
  {#each Object.keys(items) as item}
    <div class="space1 {routetag(item)}">
      <label>
        <input type="checkbox"
        data-item={item}
        on:click={clicked} 
        bind:checked={items[item]}/>
        {item}
      </label>
    </div>
  {/each}
</div>

<style>
.border {
  border-style: solid;
}
.space0 {
  font-size: medium;
  font-weight: bolder;
  color: darkblue;
  background: deepskyblue;
}
.space1 {
  color: grey;
  padding-left: 10px;
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
