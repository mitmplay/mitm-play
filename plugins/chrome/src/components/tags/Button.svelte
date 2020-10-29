<script>
import { onMount } from 'svelte';
import { tags } from './stores.js';
let autoSave = true;

function btnReset(e) {
  window.mitm.files.route_events.routeTable();
}

function btnSave(e) {
  const {__tag1, __tag2, __tag3} = window.mitm;
  const tags = {
    __tag1,
    __tag2,
    __tag3,
  };
  ws__send('saveTags', $tags);
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
      console.log('clicked', e.target);
    }
  };

  window.mitm.browser.chgUrl_events.tagsEvent = function() {
    console.log('Update tags!');
    tags.set({...$tags});
  }
});
</script>

<div class="btn-container">
  <label class="checker">
    <input type="checkbox"
    bind:checked={$tags.filterUrl}/>
    Activeurl
  </label>
  <button class="tlb btn-go" on:click="{btnReset}" disabled={autoSave}>Reset</button>
  <button class="tlb btn-go" on:click="{btnSave}"  disabled={autoSave}>Save</button>
  <label class="checker">
    <input type="checkbox"
    bind:checked={autoSave}/>
    Autosave
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
.tlb {
  border: none;
}
.checker {
  color: chocolate;
  font-weight: 600;
}
</style>