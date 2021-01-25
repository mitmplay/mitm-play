<script>
import { tags } from './stores.js';
import Expand from '../button/Expand.svelte';
import Collapse from '../button/Collapse.svelte';

export let ns;
const list = window.mitm.routes[ns]._childns.list

function q(key) {
  return key.replace(/[@.]/g, '-')
}
function childns(_ns) {
  const {_childns} = window.mitm.routes[ns]
  if (_childns && _childns.list!==undefined) {
    return Object.keys(_childns.list)
  } else {
    return []
  }
}
function setSubns(e) {
  setTimeout(() => {
    const {_childns} = window.mitm.routes[ns]
    _childns._subns = ''
    for (const id in _childns.list) {
      if (_childns.list[id]) {
        _childns._subns = id
        break
      }
    }
    tags.set({...$tags})
  }, 1);
}
</script>

<div class="space0">
  <Collapse on:message name="state2" q="{`.t2.${q(ns)}`}"></Collapse>
  <Expand on:message name="state2" q="{`.t2.${q(ns)}`}"></Expand>
  <span class="ns">[{ns==='_global_' ? ' * ' : ns.split('@').pop()}]</span>
  {#each childns(ns) as item}
    <label class="checker">
      <input
      type="checkbox"
      on:click="{setSubns}"
      bind:checked={list[item]}/>
      {item.split('@')[0]}
    </label>
  {/each}
</div>

<style>
.space0 {
  line-height: 1.5;
  font-size: 14px;
  font-weight: bolder;
  color: darkblue;
  background: lightgrey;
}
span.ns {
  margin: 0 -4px;
}
label {
  display: contents !important;
  font-size: small;
  color: brown;
}
label input {
  margin: 0 -4px;
  vertical-align: middle;
}
</style>