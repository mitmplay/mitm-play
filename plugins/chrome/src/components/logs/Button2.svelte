<script>
import { tabstore } from './tab.js';

function btnMin() {
  const {tab, editor} = $tabstore;
  const id = `editor${tab+1}`;
  editor[id].trigger('fold', 'editor.foldAll');
}

function btnPlus() {
  const {tab, editor} = $tabstore;
  const id = `editor${tab+1}`;
  editor[id].trigger('fold', 'editor.unfoldAll');
}
</script>

<div class="btn-container">
  <button class="tlb btn-min"  on:click="{btnMin}" >[--]</button> -
  <button class="tlb btn-plus" on:click="{btnPlus}">[++]</button>.
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