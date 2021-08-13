<script>
import { urls } from './url-debounce';
import { onMount } from 'svelte';
import { tags } from './stores.js';
const _c = 'color: blueviolet'

let autoSave = true;
let _tags = $tags;

function btnReset(e) {
  window.mitm.files.route_events.routeTable();
}

function btnSave(e) {
  const {__tag1, __tag2, __tag3, routes} = window.mitm;
  const _childns = {}
  for (const ns in routes) {
    _childns[ns] = routes[ns]._childns
  }
  const tags = {
    _childns,
    __tag1,
    __tag2,
    __tag3,
  };
  console.log('%cTags: saveTags', _c, e.target);
  ws__send('saveTags', tags);
  urls()
}

onMount(() => {
  let debounce = false;
  document.querySelector('.set-tags').onclick = function(e) {
    const {type} = e.target.attributes;
    if (type) {
      const {value} = type;
      if (autoSave && value==='checkbox') {
        if (debounce) {
          clearTimeout(debounce);
        }
        debounce = setTimeout(() => {
          debounce = false;
          btnSave(e);
        },50)
      }
    }
  };

  window.mitm.browser.chgUrl_events.tagsEvent = function() {
    console.log('%cLogs: Update tags!', _c);
    tags.set({...$tags});
  }
});
</script>

<div class="btn-container">
  <label class="checker">
    <input
    type="checkbox"
    bind:checked={$tags.list}/>
    routes
  </label>
  <label class="checker">
    <input
    type="checkbox"
    bind:checked={$tags.check}/>
    check
  </label>
  <label class="checker">
    <input
    type="checkbox"
    bind:checked={$tags.uniq}/>
    fit
  </label>
  <label class="checker mth">
    <input
    type="checkbox"
    bind:checked={$tags.mth}/>
    method
  </label>
  <!-- <label class="checker">
    <input 
    type="checkbox"
    on:click="{urls}"
    bind:checked={$tags.filterUrl}/>
    current-tab
  </label> -->
  <button class="tlb btn-go" on:click="{btnReset}" disabled={autoSave}>reset</button>
  <button class="tlb btn-go" on:click="{btnSave}"  disabled={autoSave}>save</button>
  <label class="checker">
    <input
    type="checkbox"
    bind:checked={autoSave}/>
    autosave
  </label>
  .
</div>

<style>
.btn-container {
  position: absolute;
  margin-top: -1px;
  padding-right: 4px;
  padding-bottom: 3px;
  right: 0;
  z-index: 5;
  top: -2px;
}
.btn-container button {
  font-size: 10px;
  cursor: pointer;
}
.btn-container button:disabled {
  cursor: auto;
}
.btn-container input {
  vertical-align: -2px;
}
.tlb {
  border: none;
}
.checker {
  color: chocolate;
  font-weight: 600;
  font-size: 12px;
}
.checker.mth {
  color: red;
  font-weight: 700;
}
</style>