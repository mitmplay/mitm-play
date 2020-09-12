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
    tags.set({
      __tag1,
      __tag2,
      __tag3,
    })
  }, 10);
}
</script>

<div class="border">
  <div class="space0">ns:{ns}</div>
  {#each Object.keys(items) as item}
    <div class="space1">
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
  border-style: dotted;
}
.space0 {
  font-weight: bolder;
  color: darkblue;
}
.space1 {
  padding-left: 10px;
}
</style>
