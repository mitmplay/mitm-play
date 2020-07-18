<script>
export let left;
export let height;

import {createEventDispatcher} from 'svelte';
import Splitter from './Splitter.svelte';

const dispatch = createEventDispatcher();

function resize() {
  let css = `left: ${left}px;width: calc(100vw - ${+left+17}px);`
  if (height) {
    css += `height: calc(100vh - ${height}px);`;
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

<div class="vbox right" style="{resize()}">
  <Splitter on:drag={dragged} on:dragend={dragend} height="{height}"/>
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
}


</style>