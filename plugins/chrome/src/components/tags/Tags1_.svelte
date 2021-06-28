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
        console.log($tags, ns, checked)
        const _global_ = ns.match('_global_')
        let arr = []
        if (_global_) {
          // set global only if match with tag in _global_.tag2
          arr = Object.keys(__tag2._global_).filter(x=>x.match(tag))
        }
        if (!_global_ || arr.length) {
          __tag1[ns][tag] = checked
          if (id1) {
            for (let tg in list) {
              if (group1===tg) {
                __tag1[ns][group1] = checked;
              } else {
                const [group2, id2] = tg.split('~');
                if (tag!==tg && group1===group2 && id2) {
                  __tag1[ns][tg] = false;
                }
              }
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
    tags.set({
      ...$tags,
      __tag1,
      __tag2,
      __tag3,
    }) 
  }, 10);
}

function routetag(tags, item) {
  const { browser } = window.mitm;
  const slc = tags.__tag1[item] ? 'slc' : '';
  const grp = tags.tgroup[item] ? 'grp' : '';
  let itm = ''
  if (tags.tgroup[item]) {
    for (const ns of browser.nss) {
      const tag3 = tags.__tag3[ns] || []
      for (const id in tag3) {
        const secs = tag3[id]
        for (const sec in secs) {
          const tags = secs[sec].tags // feat: update __tag3
          for (const tag in tags) {
            if (item===tag.split(':').pop()) {
              itm = 'itm '
              break
            }
          }
        }
      }
    }
  }
  let url = ''
  if (list[item]) { // if group no need to check
    if (tags.check && !list[item].value) {
      itm += 'hidden'
    }
    for (const ns of browser.nss) {
      const tag3 = tags.__tag3[ns] || [] // feat: update __tag3
      for (const id in tag3) {
        if (id.match(`:${item}:`)) {
          url = 'url'
          break
        }
      }
    }
  }
  return `rtag ${grp} ${slc} ${itm} ${url}`;
}

function listTags(tags) {
  console.log('rerender...');
  const {browser, routes, fn: {oneSite}} = window.mitm;
  const obj = {}
  const nss = []
  const {check} = tags
  for (let ns in tags.__tag1) {
    nss.push(ns)
    if (oneSite(tags, ns)) {
      ns = routes[ns]._childns._subns || ns // feat: chg to child namespace
      const tag1 = tags.__tag1[ns]
      for (const id in tag1) {
        const _check =  tag1[id]
        if (obj[id]===undefined || _check) {
          // collect if setting is not check or all check
          if (!check || _check) {
            obj[id] = _check
          }
        }
      }
    }
  }
  list = {}
  const keys = Object.keys(obj).sort()
  for (const [idx, id1] of keys.entries()) {
    const id2  = keys[idx+1]
    const arr1 = id1.split('~')
    const arr2 = id2 ? id2.split('~') : undefined

    let group = undefined
    if(arr2) {
      const [g1] = arr1
      const [g2] = arr2
      const match1 = id1.match(`^${g2}`)
      const match2 = id2.match(`^${g1}`)
      if (match1) {group = g2} else 
      if (match2) {group = g1} 
    }
    if (!group) {
      if (arr1[1]) {
        group = arr1[0]
      } else {
        const id0 = keys[idx-1]
        if (id0) {
          const [g0] = id0.split('~')
          if (id1.match(`^${g0}`)) {
            group = g0
          }
        }
      }
    } 

    let value = obj[id1]
    list[id1] = {value, group}
  }
  browser.nss = nss;
  const arr = []
  let same = undefined
  for (const key in list) {
    const {group} = list[key]
    if (group) {
      if (same!==group) {
        same = group
        arr.push(`${group}!`)
      }
    } else {
      arr.push(key)
    }
  }
  tgs = arr;
  return tgs;
}
function enter(e) {
  const { rclass } = window.mitm.fn;
  const node = document.querySelector(`#urls`)
  if (node) {
    const {item} = e.target.dataset;
    const klass = item.replace(rclass, '-')
    const css = `
    .urls ._${klass},
    .farg ._${klass},
    .t2 .spacex._${klass},
    .t3 .space3._${klass} {background: yellow;}
    .t2 .space1._${klass},
    .t3 .space1._${klass} {background: #dbf601 !important;}`
    node.innerHTML = css
  }
}
function leave(e) {
  const {item} = e.target.dataset;
  const node = document.querySelector(`#urls`)
  if (node) {
    node.innerHTML = ``
  }
}
function props(tags) {
  let props = {}
  if (tags.check) {
    props.disabled = true
  }
  return props
}
function subitem(g) {
  const [group] = g.split(/!/)
  const arr = []
  for (const key in list) {
    const obj = list[key]
    if (obj.group===group) {
      arr.push(key)
    }
  }
  return arr
}
</script>

{#if listTags($tags).length}
<td style="{cols>1 ? '' : 'display:none;'}">
  <div class="border">
    {#each tgs as item}
      {#if item.match(/!/)}
        <details class="tag1">
          <summary><span>{item.split(/!/)[0]}</span></summary>
          {#each subitem(item) as item2}
            <div class="space0 {routetag($tags, item2)}">
              <label 
              data-item={item2}
              on:mouseenter={enter}
              on:mouseleave={leave}
              >
                <input type="checkbox"
                data-item={item2}
                on:click={clicked}
                bind:checked={list[item2].value}
                {...props($tags, list[item])}/>
                <span class="big">{item2}</span>
              </label>
            </div>  
          {/each}
        </details>
      {:else}
        <div class="space0 {routetag($tags, item)}">
          <label 
          data-item={item}
          on:mouseenter={enter}
          on:mouseleave={leave}
          >
            <input type="checkbox"
            data-item={item}
            on:click={clicked}
            bind:checked={list[item].value}
            {...props($tags, list[item])}/>
            <span class="big">{item}</span>
          </label>
        </div>
      {/if}
    {/each}
</div>
</td>
{/if}


<style>
td {
  width: 20%;
}
details.tag1 {
  background: aliceblue;
}
.tag1>summary {
  padding-left: 8px;
}
.tag1>summary::marker {
  color: coral;
}
.tag1>summary>span {
  padding-left: 2px;
  color: coral;
  font-size: 13px;
  font-weight: 700;
  font-family: serif;
  vertical-align: 10%;
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
.space0.hidden {
  display: none;
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
.space0>label input {
  vertical-align: -0.6px;
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
details .space0 input {
  margin-left: 12px;
}
</style>
