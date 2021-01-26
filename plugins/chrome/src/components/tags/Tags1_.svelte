<script>
import { tags } from './stores.js';
export let cols;
/***
* ex:
* __tag1[ns][remove-ads~1] = true
* __tag1[ns][remove-ads~2] = false
***/
let tgs = [];
let list = {};

function clicked(e) {
  const { routes, fn } = window.mitm;
  const { resetRule3, oneSite } = fn;
  const tagsStore = $tags;
  setTimeout(()=>{
    const {__tag1,__tag2,__tag3} = $tags;
    const {dataset, checked} = e.target;
    const {item: tag} = dataset;
    const [group1, id1] = tag.split('~');

    for (let ns in __tag1) {
      if (oneSite(tagsStore, ns)) {
        ns = routes[ns]._childns._subns || ns // feat: chg to child namespace
        __tag1[ns][tag] = checked
        if (id1 && checked) {
          for (let tg in list) {
            const [group2, id2] = tg.split('~');
            if (group1===group2 && id1!==id2) {
              if (__tag1[ns][group1]!==undefined) {
                __tag1[ns][group1] = true;
              }
              __tag1[ns][tg] = false;
            }
          }
        }
      }
    }

    for (let ns in __tag2) {
      if (oneSite(tagsStore, ns)) {
        ns = routes[ns]._childns._subns || ns // feat: chg to child namespace
        const tags = __tag2[ns];
        for (let tg in tags) {
          const typ2 = tg.split(':')[1] || tg;
          if (tag===typ2) {
            tags[tg].state = checked; // feat: update __tag2
          } 
          if (group1===typ2.split('~')[0]) {
            tags[tg].state = __tag1[ns][typ2] || false; // feat: update __tag2
          }
        }
      }
    }

    resetRule3($tags, tag)
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
  const {browser, routes, fn: {oneSite}} = window.mitm;
  list = {}
  const nss = []
  for (let ns in tags.__tag1) {
    nss.push(ns)
    if (oneSite(tags, ns)) {
      ns = routes[ns]._childns._subns || ns // feat: chg to child namespace
      const tag1 = tags.__tag1[ns]
      for (const id in tag1) {
        if (list[id]===undefined || tag1[id]) {
          list[id] = tag1[id]
        }
      }
    }
  }
  browser.nss = nss;
  tgs = Object.keys(list).sort();
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
    }
    .t2 .space1._${klass} {
      background: #dbf601;;
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
        bind:checked={list[item]}/>
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
  font-family: serif;
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
