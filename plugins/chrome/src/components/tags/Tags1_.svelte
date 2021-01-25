<script>
import { tags } from './stores.js';
export let cols;
/***
* ex:
* __tag1[remove-ads~1] = true
* __tag1[remove-ads~2] = false
***/
let tgs = [];
function clicked(e) {
  const { routes, fn } = window.mitm;
  const { resetRule3, oneSite } = fn;
  const {__tag1: {...tagx}} = $tags;
  const tagsStore = $tags;
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
          if (__tag1[group1]!==undefined) {
            __tag1[group1] = flag;
          }
          __tag1[ns] = !flag;
        } else if (__tag1[group1]!==undefined) {
          __tag1[group1] = flag;
        }
      }
    }

    for (let ns in __tag2) {
      if (oneSite(tagsStore, ns)) {
        ns = routes[ns]._childns._subns || ns // feat: chg to child namespace
        const namespace2 = __tag2[ns];
        for (let itm in namespace2) {
          const typ2 = itm.split(':')[1] || itm;
          if (item===typ2) {
            namespace2[itm].state = flag; // feat: update __tag2
          } 
          if (group1===typ2.split('~')[0]) {
            namespace2[itm].state = __tag1[typ2] || false; // feat: update __tag2
          }
        }
      }
    }

    resetRule3($tags, item)
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

function routetag(item) {
  const { browser } = window.mitm;
  const slc = $tags.__tag1[item] ? 'slc' : '';
  const grp = $tags.tgroup[item] ? 'grp' : '';
  let itm = ''
  if ($tags.tgroup[item]) {
    for (const ns of browser.nss) {
      const tag3 = $tags.__tag3[ns] || []
      for (const id in tag3) {
        const secs = tag3[id]
        for (const sec in secs) {
          const tags = secs[sec].tags // feat: update __tag3
          for (const tag in tags) {
            if (item===tag.split(':').pop()) {
              itm = 'itm'
              break
            }
          }
        }
      }
    }
  }
  let url = ''
  for (const ns of browser.nss) {
    const tag3 = $tags.__tag3[ns] || [] // feat: update __tag3
    for (const id in tag3) {
      if (id.match(`:${item}:`)) {
        url = 'url'
        break
      }
    }
  }
  return `rtag ${grp} ${slc} ${itm} ${url}`;
}

function listTags(tags) {
  console.log('rerender...');
  const {browser, routes, fn: {toRegex}} = window.mitm;
  const list = {};

  function add(ns) {
    const {_subns} = routes[ns]._childns
    for (let id in tags.__tag2[_subns || ns]) { // feat: chg to child namespace
      const [k,v] = id.split(':');
      list[v||k] = true;
    }
  }

  tgs = [];
  if (tags.filterUrl) {
    const nss = []
    for (let ns in tags.__tag2) {
      const rgx = toRegex(ns.replace(/~/,'[^.]*'));
      if (browser.activeUrl.match(rgx)) {
        nss.push(ns)
        add(ns);
      }
    }
    add('_global_');
    browser.nss = nss;
    tgs = Object.keys(list).sort();
  } else {
    browser.nss = Object.keys(tags.__tag2)
    tgs = Object.keys(tags.__tag1);
  }
  return tgs;
}
function enter(e) {
  const { rclass } = window.mitm.fn;
  const node = document.querySelector(`#urls`)
  if (node) {
    const {item} = e.target.dataset;
    const klass = item.replace(rclass, '-')
    node.innerHTML = `
    ._${klass},
    .t2 .spacex._${klass},
    .t3 summary._${klass},
    .space3._${klass} {
      background: yellow;
    }`
  }
}
function leave(e) {
  const {item} = e.target.dataset;
  const node = document.querySelector(`#urls`)
  if (node) {
    node.innerHTML = ``
  }
}
</script>

{#if listTags($tags).length}
<td style="{cols>1 ? '' : 'display:none;'}">
  <div class="border">
    {#each tgs as item}
    <div class="space0 {routetag(item)}">
      <label 
      data-item={item}
      on:mouseenter={enter}
      on:mouseleave={leave}
      >
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
{/if}

<style>
  td {
    width: 20%;
  }
.border {
  border: 1px dotted;
}
.space0 {
  font-size: 13px;
  font-weight: bolder;
  color: darkblue;
  /* background: deepskyblue; */
}
.space0 span {
  vertical-align: 15%;
}
.space0 .big {
  margin-left: -4px;
}
.space0>label {
  padding-left: 6px;
}
.rtag {
  color: grey;
}
.rtag.slc {
  color: green;
  font-weight: bolder;
}
.rtag.slc.grp {
  color: red;
  font-weight: bolder;
}
.rtag.slc.url,
.rtag.slc.grp.itm.url {
  color: #c36e01;
}
.rtag.slc.grp.itm {
  color: green;
}
.rtag.grp {
  background-color: beige;
}
.rtag.grp.itm, .rtag.url {
  text-decoration: underline;
}
</style>
