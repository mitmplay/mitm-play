<script>
import { urls } from './url-debounce';
import { tags } from './stores.js';

function items(tags) {
  const arr = []
  const {routes, fn: {oneSite}} = window.mitm
  for (const ns in routes) {
    const {preset} = routes[ns]
    if (oneSite(tags, ns) && preset) {
      for (const id in preset) {
        arr.push({ns, id})
      }
    }
  }
  return arr
}
function clicked(e) {
  const {routes} = window.mitm
  const {ns, id} = e.target.dataset
  const {__tag1, __tag2, __tag3} = $tags
  const preset = window.mitm.routes[ns].preset[id]
  for (const key in __tag1[ns]) {
    __tag1[ns][key] = !!preset[key]
  }
  for (const key in __tag2[ns]) {
    __tag2[ns][key].state = !!preset[key]
  }
  for (const path in __tag3[ns]) {
    const secs = __tag3[ns][path]
    for (const sec in secs) {
      const {tags} = secs[sec]
      for (const tag in tags) {
        tags[tag] = !!preset[tag]
      }
    }
  }
  window.mitm.__tag1 =  __tag1
  window.mitm.__tag2 =  __tag2
  window.mitm.__tag3 =  __tag3
  tags.set({
    ...$tags,
    __tag1,
    __tag2,
    __tag3
  })
  const _childns = {}
  for (const ns in routes) {
    _childns[ns] = routes[ns]._childns
  }
  const svtags = {
    _childns,
    __tag1,
    __tag2,
    __tag3,
  };  
  console.log({ns, id, preset})
  ws__send('saveTags', svtags)
  urls()
}
</script>

<span class="button-container">
  Preset:
  {#each items($tags) as item}
    <button 
    data-ns="{item.ns}"
    data-id="{item.id}"
    on:click="{clicked}"
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
