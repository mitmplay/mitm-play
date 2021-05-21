<script>
import { source } from './stores.js';
import { tags } from '../tags/stores';
import Exbutton from '../monaco/Exbutton.svelte';

function btnSave(e) {
  const { tab } = $source;
  const editor = window.mitm.editor[`_route${tab+1}`]
  if (editor) {
    const content = editor.getValue()
    source.update(n => {
      return {
        ...n,
        content,
        saveDisabled: true,
        editbuffer: content
      }
    })
    console.log($source);
    ws__send('saveRoute', $source, data => {
      source.update(n => {return {...n, saveDisabled: true}});
      console.log('Done Save!');
    });
  }
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
  const {__tag1, __tag2, __tag3, routes} = window.mitm;
  const {url, ns} = e.target.dataset
  const {_childns: chld} = routes[ns]
  const {list} = chld
  for (const id in list) {
    list[id] = false
  }
  list[ns] = true
  chld._subns = ns
  tags.set({...$tags})
  const _childns = {}
  for (const ns in routes) {
    _childns[ns] = routes[ns]._childns
  }
  ws__send('saveTags', {_childns, __tag1, __tag2, __tag3});
  setTimeout(()=>chrome.tabs.update({url}), 100)
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
    <button
      class="tlb btn-go"
      on:click="{btnTag}"
      data-ns={$source.item}
      data-url="{btnUrl(item)}">
      {item}
    </button> - 
  {/each}
  <button
    class="tlb btn-go"
    on:click="{btnGo}"
    disabled={$source.goDisabled}>
    Go
  </button>.
  </div>
{/if}
<div class="file-path">
Path:{$source.path}
{#if $source.path}
	<div class="btn-container">
  <Exbutton source={$source} editor="_route{$source.tab+1}"/>
  <button class="tlb btn-save" disabled={$source.saveDisabled} on:click="{btnSave}">Save</button>
  </div>
{/if}
</div>

<style>
.file-path {
  position: relative;
  font-family: auto;
  font-size: 0.9em;
  color: blue;
  padding-left: 5px;
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