<script>
import { tags } from './stores.js';
import Expand from '../button/Expand.svelte';
import Collapse from '../button/Collapse.svelte';

export let ns;
const route = window.mitm.routes[ns]
const list = route ? route._childns.list : []

function q(key) {
  return key.replace(/[@~.]/g, '-')
}
function childns(_ns) {
  const {_childns} = window.mitm.routes[ns] || {}
  if (_childns && _childns.list!==undefined) {
    return Object.keys(_childns.list)
  } else {
    return []
  }
}
function setSubns(e) {
  const {checked, dataset} = e.target
  setTimeout(() => {
    const {_childns} = window.mitm.routes[ns]
    let {item: _ns} = dataset
    if (checked) {
      const {list} = _childns
      for (const id in list) {
        list[id] = _ns===id
      }
    } // feat: only for sub-apps
    _childns._subns = checked ? _ns :  _ns.split('@').pop()
    tags.set({...$tags})
  }, 1);
}
</script>

<div data-app=Tags2_Title class="space0">
  <!-- feat: auto collapsed between tag2 & tag3 -->
  <Collapse on:message name="state2" q="{`.t2.${q(ns)}`}"></Collapse>
  <Expand on:message name="state2" q="{`.t2.${q(ns)}`}"></Expand>
  <span class="ns">
    {#if ns.match('_global_')}
      [<span>{' * '}</span>]
    {:else}
      {ns.split('@').pop()}
    {/if}
  </span>
  {#each childns(ns) as item}
    <label class="checker">
      <input
      type="checkbox"
      data-item="{item}"
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
  font-family: serif;
  font-weight: bolder;
  color: darkblue;
  background: lightgrey;
}
span.ns {
  margin: 0;
}
span.ns span {
  vertical-align: -5px;
  line-height: 0.8;
  font-size: 18px;
}
label {
  display: contents !important;
  font-size: small;
  color: brown;
}
label input {
  margin: 0 -2px;
  vertical-align: middle;
}
</style>