<script>
export let top;
export let left;

import {createEventDispatcher} from 'svelte';
import Splitter from './Splitter.svelte';

const dispatch = createEventDispatcher();

function resize() {
  let css = `left: ${left}px;width: calc(100vw - ${left}px);`
  if (top) {
    css += `height: calc(100vh - ${top}px);`;
  }
  return css;
}

function dragged(e) {
  dispatch('drag',  e.detail);
}

function dragend(e) {
  dispatch('dragend',  e.detail);
}
</script>

<div class="vbox right" style="{resize(left)}">
  <Splitter on:drag={dragged} on:dragend={dragend} {top}/>
  <slot></slot>
</div>

<style>
.vbox {
  flex: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}
.vbox.right {
  right: 0;
  left: 163px;
  position: absolute;
  background: #f1f7f7e3;
  width: calc(100vw - 163px);
  height: calc(100vh - 27px);
  overflow: hidden;
}


</style>