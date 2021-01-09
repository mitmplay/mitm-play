<script>
export let q;
export let st;

function btnOpen(e) {
  st.expand = !st.expand
  const nodes = document.querySelectorAll(`${q} details`)
  if (st.expand) {
    nodes.forEach(node => node.setAttribute('open', ''))
  } else {
    nodes.forEach(node => node.removeAttribute('open'))
  }
}
</script>

<button class="expand" on:click="{btnOpen}">[<b>+</b>]</button>

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