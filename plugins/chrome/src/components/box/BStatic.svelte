<script>
export let top;
export let block=false;

function resize() {
  return top ? `height: calc(100vh - ${top}px);` : '';
}
</script>

<div class="vbox left">
  {#if block}
    <slot></slot>
  {:else}
    <div class="table-container" style="{resize()}">
      <slot></slot>
    </div>
  {/if}
</div>

<style>
.vbox {
  flex: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}
.vbox.left {
  width: 100%;
}
.table-container {
  overflow: auto;
  height: calc(100vh - 27px);
}
</style>
