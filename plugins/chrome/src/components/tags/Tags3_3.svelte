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
  let klas = items[item] ? 'rtag slc' : 'rtag';
  if (item.match(':')) {
    klas += ' r2'
  }
  return klas
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
function title(item) {
  const [key, tag] = item.split(':')
  return tag ? `${tag}{${key}}` : key
}
function xitems(tags) {
  return Object.keys(items).sort(sort)
}
</script>

{#each xitems($tags) as item}
  <div class="space3 {routetag(item)}">
    <label>
      <input type="checkbox"
      data-item={item}
      on:click={clicked} 
      bind:checked={items[item]}/>
      <span>{title(item)}</span>
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
}
.rtag.slc {
  color: #5dac75;
  font-weight: bolder;
}
.rtag.slc.r2 {
  color: #da8181;
}
</style>
