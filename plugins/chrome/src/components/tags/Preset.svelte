<script>
import { urls } from './url-debounce';
import { tags } from './stores.js';

function clicked(e) {
  const {routes} = window.mitm
  const {ns, id} = e.target.dataset
  const {__tag1, __tag2, __tag3} = window.mitm
  const [...preset] = window.mitm.routes[ns].preset[id].tags
  for (const path in __tag3[ns]) {
    const secs = __tag3[ns][path]
    for (const sec in secs) {
      const {tags} = secs[sec]
      for (const tag in tags) {
        tags[tag] =  preset.indexOf(`tag3:${tag}`)>-1
        tags[tag] && preset.push(tag.split(':').pop())
      }
    }
  }
  for (const tag in __tag2[ns]) {
    const _tg = __tag2[ns][tag]
    _tg.state =  preset.indexOf(tag)>-1
    _tg.state && preset.push(tag.split(':').pop())
  }
  for (const tag in __tag1[ns]) {
    __tag1[ns][tag] = preset.indexOf(tag)>-1
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
  const arr = []
  const {routes, fn: {oneSite}} = window.mitm
  for (const ns in routes) {
    const {preset} = routes[ns]
    if (preset && oneSite(tags, ns)) {
      for (const id in preset) {
        arr.push({ns, id})
      }
    }
  }
  return arr
}
function title(item) {
  const {ns, id} = item
  return window.mitm.routes[ns].preset[id].title
}
</script>

<span class="button-container">
  Preset:
  {#each items($tags) as item}
    <button 
    data-ns="{item.ns}"
    data-id="{item.id}"
    on:click="{clicked}"
    title="{title(item)}"
    >[{item.id}]</button>
  {/each}
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
