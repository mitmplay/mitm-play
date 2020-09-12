<script>
import { tags } from './stores.js';

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
</script>

<div class="btn-container">
  <button class="tlb btn-go" on:click="{btnReset}">Reset</button>
  <button class="tlb btn-go" on:click="{btnSave}">Save</button>.
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