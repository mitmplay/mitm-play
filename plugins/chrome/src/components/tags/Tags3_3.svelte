<script>
import { tags } from './stores.js';

export let items;
export let item;
export let path;
export let ns;

function clicked(e) {
  setTimeout(()=>{
    const {__tag3} = $tags;
    const namespace = __tag3[ns];
    const {item: i} = e.target.dataset;
    const [group1, id1] = i.split('~');
    console.log('e', {__tag3});

    for (let pth in namespace) {
      const typs = namespace[pth];
      for (let tsk in typs) {
        const items2 = typs[tsk];
        if (typeof items2!=='string') {
          for (let itm in items2) {
            const [group2, id2] = itm.split('~');
            if (group1===group2 && id1!==id2) {
              items2[itm] = false;
              // tags.set({
              //   ...$tags,
              //   __tag3,
              // })
            }
          }
        }
      }
    }
    tags.set({
      ...$tags,
      __tag3,
    })
  }, 50);
}

function routetag(item) {
  return items[item] ? 'rtag slc' : 'rtag';
}

function xitems(tags) {
  const {__tag3} = tags;
  const namespace = __tag3[ns];
  const typs = namespace[path];
  const itms = typs[item];
  return Object.keys(itms).sort();
}
</script>

{#each xitems($tags) as item}
  <div class="space3 {routetag(item)}">
    <label>
      <input type="checkbox"
      data-item={item}
      on:click={clicked} 
      bind:checked={items[item]}/>
      <span>{item}</span>
    </label>
  </div>
{/each}

<style>
.space3 {
  padding-left: 20px;
}
.space3 span {
  vertical-align: 15%;
}
.rtag {
  font-size: 13px;
  color: cadetblue;
  background-color: beige;
}
.rtag.slc {
  color: #5dac75;
  font-weight: bolder;
}
</style>
