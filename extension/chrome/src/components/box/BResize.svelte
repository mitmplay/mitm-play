<script>
import Splitter from './Splitter.svelte';

function resize() {
  const left = window._codeResize || 163;
  return `left: ${left}px;`
}
function dragged(e) {
  console.log(e.detail);
}
</script>

<div class="vbox right" style="{resize()}">
  <Splitter on:drag={dragged}/>
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