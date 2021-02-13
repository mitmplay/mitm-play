<script>
import { onMount } from 'svelte';
import { cfg, resize } from '../monaco/init';
import { source } from './stores.js';

export let onChange;
export let item;

onMount(async () => {
  window.mitm.monaco.router1 = monacoNS => {
    const element = window.document.getElementById('monaco');
    const _route =  window.monaco.editor.create(element, cfg);
    const ro = new ResizeObserver(resize(_route))
    ro.observe(element);

    window.mitm.editor._route = _route;
    window.mitm.editor._routeEl = element;

    _route.onDidChangeModelContent(onChange);
    console.log('monaco route1 initilized!')
  }
});

function reload(item) {
  const { _route } = window.mitm.editor;
  if (_route && item) {
    _route.setValue(mitm.files.route[item].content);
    _route.revealLine(1);      
  }
  return ''
}
</script>

<div class="edit-container {$source.macro ? 'hide' : 'show'}">
  <div id="monaco"></div>
</div>
{#if !$source.macro}
{reload(item)}
{/if}

<style>
.hide {
  display: none;
}
</style>