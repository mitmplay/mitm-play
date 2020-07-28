<script>
export let height;

function resize() {
  return height ? `height: calc(100vh - ${height}px);` : '';
}
</script>

<div class="vbox left">
  <div class="table-container" style="{resize()}">
    <slot></slot>
  </div>
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
