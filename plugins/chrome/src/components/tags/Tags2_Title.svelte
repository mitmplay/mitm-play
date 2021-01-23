<script>
import Expand from '../button/Expand.svelte';
import Collapse from '../button/Collapse.svelte';

export let ns;
$: _childns = window.mitm.routes[ns]._childns

function q(key) {
  return key.replace(/\./g, '-')
}
function childns(_ns) {
  const {_childns} = window.mitm.routes[ns]
  if (_childns!==undefined) {
    return Object.keys(_childns).map(x=>x.split('@')[0])
  } else {
    return []
  }
}
function setSubns(e) {
// reset _subns string!
}
</script>

<div class="space0">
  <Collapse on:message name="state2" q="{`.t2.${q(ns)}`}"></Collapse>
  <Expand on:message name="state2" q="{`.t2.${q(ns)}`}"></Expand>
  <span class="ns">[{ns==='_global_' ? ' * ' : ns}]</span>
  {#each childns(ns) as item}
    <label class="checker">
      <input
      type="checkbox"
      data-item={item}
      on:click="{setSubns}"
      bind:checked={_childns[`${item}@${ns}`]}/>
      {item}
    </label>
  {/each}
</div>

<style>
.space0 {
  line-height: 1.5;
  font-size: 15px;
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