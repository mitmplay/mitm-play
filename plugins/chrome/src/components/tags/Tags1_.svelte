<script>
import { tags } from './stores.js';

function clicked(e) {
  setTimeout(()=>{
    const {__tag1,__tag2,__tag3} = $tags;
    const {item} = e.target.dataset;
    const flag = __tag1[item];
    console.log('e', flag);

    for (let ns in __tag2) {
      const namespace = __tag2[ns];
      for (let itm in namespace) {
        const typ2 = itm.split(':')[1] || itm;
        if (item===typ2) {
          namespace[itm] = flag;
        }
      }
    }

    for (let ns in __tag3) {
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
  return $tags.__tag1[item] ? 'rtag slc' : 'rtag';
}

function listTags(tags) {
  if (tags.filterUrl) {
    const list = [];
    for (let ns in tags.__tag2) {
      if (mitm.browser.activeUrl.match(ns)) {
        for (let id in tags.__tag2[ns]) {
          const [k,v] = id.split(':');
          list.push(v||k);
        }
        return list;
      }
    }
    return list;
  } else {
    return Object.keys(tags.__tag1);
  }
}
</script>

<td>
  <div class="border">
    {#each listTags($tags) as item}
    <div class="space0 {routetag(item)}">
      <label>
        <input type="checkbox"
        data-item={item}
        on:click={clicked} 
        bind:checked={$tags.__tag1[item]}/>
        {item}
      </label>
    </div>
    {/each}
  </div>
</td>

<style>
.border {
  border-style: dotted;
}
.space0 {
  font-size: medium;
  font-weight: bolder;
  color: darkblue;
  /* background: deepskyblue; */
}
.rtag {
  color: grey;
  font-style: italic;
  /* background-color: beige; */
}
.rtag.slc {
  color: green;
  font-weight: bolder;
}
</style>
