<div class="vbox left">
  <div class="table-container">
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
.table-container {
  overflow: auto;
  height: calc(100vh - 27px);
}
</style>