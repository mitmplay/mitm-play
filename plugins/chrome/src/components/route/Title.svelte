<script>
function btnRestart(e) {
  ws__send('restart', '')
};
</script>

-Route(s)-
<div class="btn-container">
  <button on:click="{btnRestart}">[restart]</button>
</div>

<style>
.btn-container {
  display: inline;
}
.btn-container button {
  background: transparent;
  margin-left: -5px;
  font-size: 10px;
  cursor: pointer;
  padding: 2px;
  border: 0;
}
.btn-container button:disabled {
  cursor: auto;
}
</style>