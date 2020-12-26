<script>
function btnClose() {
  const nodes = document.querySelectorAll('#list-help details[open]')
  nodes.forEach(node => node.removeAttribute('open'))
}
</script>

-Help-
<button class="clollapse" on:click="{btnClose}">[--]</button>

<style>
button {
  cursor: pointer;
  color: #002aff;
  background: transparent;
  font-family: Consolas, Lucida Console, Courier New, monospace;
  font-weight: 700;
  font-size: 10px;
  padding: 0;
  border: 0;
  margin: 0;
}
</style>
