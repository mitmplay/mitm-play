<script>// feat: profile
import { source } from './stores.js';

function btnMin() {
  const { editor: { _profile }} = window.mitm;
  _profile && _profile.trigger('fold', 'editor.foldAll');
}

function btnPlus() {
  const { editor: { _profile }} = window.mitm;
  _profile && _profile.trigger('unfold', 'editor.unfoldAll');
}

function btnSave(e) {
  const { editor: { _profile }} = window.mitm;
  if (_profile) {
    const content = _profile.getValue()
    source.update(n => {
      return {
        ...n,
        content,
        saveDisabled: true,
        editbuffer: content
      }
    })
    console.log($source);

    ws__send('saveProfile', $source, data => {
      source.update(n => {return {...n, saveDisabled: true}});
      console.log('Done Save!');
    });
  }
}

function btnOpen() {
  ws__send('openRoute', $source, data => {
    console.log('Done Open!');
  });
}

function btns(id) {
  const route = mitm.routes[id];
  if (route && route.urls) {
    return Object.keys(route.urls);
  } else {
    return [];
  }
}

function btnUrl(id) {
  const route = mitm.routes[$source.item];
  if (route && route.urls) {
    return route.urls[id];
  } else {
    return '';
  }
}

function btnTag(e) {
  chrome.tabs.update({url: e.target.dataset.url});
}

function btnGo(e) {
  const route = mitm.routes[$source.item];
  if (route && route.url) {
    chrome.tabs.update({url: route.url});
  }
}
</script>

{#if $source.path}
	<div class="btn-container">
  {#each btns($source.item) as item}
  <button class="tlb btn-go" on:click="{btnTag}"
  data-url="{btnUrl(item)}">{item}</button> - 
  {/each}
  <button class="tlb btn-go" disabled={$source.goDisabled} on:click="{btnGo}">Go</button>.
  </div>
{/if}
<div class="file-path">
Path:{$source.path}
{#if $source.path}
	<div class="btn-container">
  <button class="tlb btn-min"  on:click="{btnMin}" >[--]</button> -
  <button class="tlb btn-plus" on:click="{btnPlus}">[++]</button> -
  <button class="tlb btn-save" disabled={$source.saveDisabled} on:click="{btnSave}">Save</button> -
  <button class="tlb btn-open" disabled={$source.openDisabled} on:click="{btnOpen}">Open</button>
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