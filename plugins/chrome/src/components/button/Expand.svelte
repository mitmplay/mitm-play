<script>
export let q;

function btnOpen(e) {
  const nodes = document.querySelectorAll(`${q} details`)
  nodes.forEach(node => node.setAttribute('open', ''))
}
</script>

<button class="expand" on:click="{btnOpen}">[++]</button>

<style>
button {
  border: 0;
  cursor: pointer;
  color: #002aff;
  margin-top: -5px;
  margin-right: -5px;
  vertical-align: middle;
  background: transparent;
  padding: 2px 1px 1px 1px;
  font-family: Consolas, Lucida Console, Courier New, monospace;
  font-weight: 700;
  font-size: 10px;
}
</style>