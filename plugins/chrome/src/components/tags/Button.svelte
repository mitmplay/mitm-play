<script>
import { onMount } from 'svelte';
import { tags } from './stores.js';
let autoclick = true;

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
    const {value} = e.target.attributes.type;
    if (autoclick && value==='checkbox') {
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
});
</script>

<div class="btn-container">
  <button class="tlb btn-go" on:click="{btnReset}" disabled={autoclick}>Reset</button>
  <button class="tlb btn-go" on:click="{btnSave}"  disabled={autoclick}>Save</button>
  <label class="checker">
    <input type="checkbox"
    bind:checked={autoclick}/>
    Autoclick
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
</style>