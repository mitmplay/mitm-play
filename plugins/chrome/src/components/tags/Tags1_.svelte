<script>
import { tags } from './stores.js';
/***
* ex:
* __tag1[remove-ads~1] = true
* __tag1[remove-ads~2] = false
***/

function clicked(e) {
  const {__tag1: {...tagx}} = $tags;
  setTimeout(()=>{
    const {__tag1,__tag2,__tag3} = $tags;
    const {item} = e.target.dataset; // item = remove-ads~2
    const flag = __tag1[item];       // flag = true ~> already changed
    console.log('e', $tags);

    const [group1, id1] = item.split('~');
    if (id1) {
      for (let ns in __tag1) {
        const [group2, id2] = ns.split('~');
        if (!tagx[item] && group1===group2 && id1!==id2) {
          __tag1[ns] = !flag;
        }
      }
    }

    for (let ns in __tag2) {
      const namespace = __tag2[ns];
      for (let itm in namespace) {
        const typ2 = itm.split(':')[1] || itm;
        if (item===typ2) {
          namespace[itm] = flag;
        } 
        if (group1===typ2.split('~')[0]) {
          namespace[itm] = __tag1[typ2] || false;
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
            if (group1===itm.split('~')[0]) {
              namespace[itm] = __tag1[itm] || false;
            }
          }
        }
      }
    }
    const {filterUrl, tgroup} = $tags;
    tags.set({
      filterUrl,
      __tag1,
      __tag2,
      __tag3,
      tgroup,
    })
  }, 10);
}

function routetag(item) {
  const slc = $tags.__tag1[item] ? 'slc' : '';
  const grp = $tags.tgroup[item] ? 'grp' : '';
  return `rtag ${grp} ${slc}`;
}

function listTags(tags) {
  const {toRegex} = window.mitm.fn;
  const list = {};

  function add(ns) {
    for (let id in tags.__tag2[ns]) {
      const [k,v] = id.split(':');
      list[v||k] = true;
    }
  }

  let tgs;
  if (tags.filterUrl) {
    for (let ns in tags.__tag2) {
      const rgx = toRegex(ns.replace(/~/,'[^.]*'));
      if (mitm.browser.activeUrl.match(rgx)) {
        add(ns);
        break;
      }
    }
    add('_global_');
    tgs = Object.keys(list).sort();
  } else {
    tgs = Object.keys(tags.__tag1);
  }
  return tgs;
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
        <span class="big">{item}</span>
      </label>
    </div>
    {/each}
  </div>
</td>

<style>
.border {
  border: 1px dotted;
}
.space0 {
  font-size: medium;
  font-weight: bolder;
  color: darkblue;
  /* background: deepskyblue; */
}
.space0 .big {
  margin-left: -4px;
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
.rtag.grp {
  background-color: beige;
}
</style>
