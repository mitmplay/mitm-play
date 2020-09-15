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
    tags.set({
      __tag1,
      __tag2,
      __tag3,
    })
  }, 10);
}
</script>

<td>
  <div class="border">
    {#each Object.keys($tags.__tag1) as item}
    <div>
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
</style>
