<script>
export let q;

function btnClose(e) {
  const nodes = document.querySelectorAll(`${q} details[open]`)
  nodes.forEach(node => node.removeAttribute('open'))
}
</script>

<button class="clollapse" on:click="{btnClose}">[-]</button>

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