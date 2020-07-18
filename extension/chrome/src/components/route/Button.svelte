<script>
import { source } from './stores.js';

function btnSave(e) {
  source.update(n => {
    return {...n, content: window.monacoEditor.getValue()}
  })
  console.log($source);

  ws__send('saveRoute', $source, data => {
    console.log('Done Save!');
  });
}

function btnOpen() {
  ws__send('openRoute', $source, data => {
    console.log('Done Open!');
  });
}

function btnGo(e) {
  const route = mitm.routes[$source.item];
  if (route && route.url) {
    chrome.tabs.update({url: route.url});
  }
}
</script>

<div class="file-path">
Path:{$source.path}
{#if $source.path}
	<div class="btn-container">
  <button class="btn-save" disabled={$source.saveDisabled} on:click="{btnSave}">Save</button> -
  <button class="btn-open" disabled={$source.openDisabled} on:click="{btnOpen}">Open</button> -
  <button class="btn-go"   disabled={$source.goDisabled}   on:click="{btnGo}"  >Go</button>
  </div>
{/if}
</div>

<style>
.file-path {
  position: relative;
  font-family: auto;
  font-size: 0.9em;
  color: blue;
}
.btn-container {
  position: absolute;
  margin-top: -1px;
  padding-right: 4px;
  padding-bottom: 3px;
  right: 0;
  z-index: 5;
  top: 0;
}
.btn-container button {
  font-size: 10px;
}
</style>