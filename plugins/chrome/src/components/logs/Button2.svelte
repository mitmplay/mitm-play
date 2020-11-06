<script>
import { tabstore } from './tab.js';
import { logstore } from './stores.js';

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

function btnOpen() {
  let arr = $logstore.path.split('/')
  arr.pop();
  const path = arr.join('/');
  console.log({path});
  ws__send('openFolder', {path}, data => {
    console.log('Done Open!');
  });
}
</script>

<div class="btn-container">
  <button class="tlb btn-min"  on:click="{btnMin}" >[--]</button> -
  <button class="tlb btn-plus" on:click="{btnPlus}">[++]</button> -
  <button class="tlb btn-open" on:click="{btnOpen}">Open</button>
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