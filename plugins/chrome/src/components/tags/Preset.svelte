<script>
import { urls } from './url-debounce';
import { tags } from './stores.js';

let _items = []
function clicked(e) {
  const {routes} = window.mitm
  const {ns: _ns, id} = e.target.dataset
  const {__tag1, __tag2, __tag3} = window.mitm
  const nss = _ns.split(',')
  for (let i = 0; i < nss.length; ++i) {
    const ns = nss[i]
    const {list} = routes[ns]._childns
    for (const ns2 in list) {
      if (list[ns2]) {
        nss[i] = ns2; 
        break
      }
    }
  }
  for (const ns of nss) {
    const [...preset] = routes[ns].preset[id].tags
    const paths = __tag3[ns]
    for (const path in paths) {
      const secs = paths[path]
      for (const sec in secs) {
        const {tags} = secs[sec]
        for (const tag in tags) {
          tags[tag] =  preset.indexOf(`tag3:${tag}`)>-1
          tags[tag] && preset.push(tag.split(':').pop())
        }
      }
    }
    const tags = __tag2[ns]
    for (const tag in tags) {
      const _tg = tags[tag]
      _tg.state =  preset.indexOf(tag)>-1
      _tg.state && preset.push(tag.split(':').pop())
    }
    for (const tag in __tag1[ns]) {
      __tag1[ns][tag] = preset.indexOf(tag)>-1
    }
  }
  const _childns = {}
  for (const ns in routes) {
    _childns[ns] = routes[ns]._childns
  }
  const _tags = {
    __tag1,
    __tag2,
    __tag3
  }
  setTimeout(()=>{
    const sv = {_childns, ..._tags}
    tags.set({...$tags, ..._tags})
    ws__send('saveTags', sv)
    urls()
  }, 1)
}
function items(tags) {
  const _preset = {}
  const {routes, fn: {oneSite}} = window.mitm
  for (const ns in routes) {
    const id = routes[ns]._childns._subns
    const {preset} = routes[id || ns]
    if (preset && oneSite(tags, ns)) {
      for (const id in preset) {
        if (_preset[id]===undefined) {
          _preset[id] = {ns: [], id}
        }
        _preset[id].ns.push(ns)
      }
    }
  }
  const arr = []
  for (const item in _preset) {
    arr.push(_preset[item])
  }
  _items = arr
  return ''
}
function title(item) {
  const {routes} = window.mitm
  const {ns: nss, id} = item 
  const arr = []
  for (const ns of nss) {
    let title
    if (routes[ns].preset[id]) {
      title = routes[ns].preset[id].title
    }
    title && arr.push(`${title} ${ns}`)
  }
  return arr.join(',\n')
}
</script>

{items($tags)}
<span class="button-container">
  {#if _items.length}
    Preset:
    {#each _items as item}
      <button 
      data-ns="{item.ns.join(',')}"
      data-id="{item.id}"
      on:click="{clicked}"
      title="{title(item)}"
      >[{item.id}]</button>
    {/each}
  {/if}
</span>

<style>
.button-container {
  float: right;
  margin-top: -1px;
}
button {
  border: 0;
  cursor: pointer;
  color: #002aff;
  margin-top: 1px;
  margin-right: 2px;
  vertical-align: 0.6px;
  background: transparent;
  padding: 2px 1px 1px 1px;
  font-family: Consolas, Lucida Console, Courier New, monospace;
  font-weight: 700;
  font-size: 10px;
}
</style>
