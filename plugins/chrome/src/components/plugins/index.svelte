<script>
import Item from "../profile/Item.svelte";

function plugins() {
  const {plugins} = window.mitm
  const arr = []
  for (const name in plugins) {
    arr.push(plugins[name])
  }
  return arr
}
function btnRestart(e) {
  const {plugins} = window.mitm
  ws__send('restart', plugins)
};
</script>

<table>
  <tr>
    <th>Name</th>
    <th>Version</th>
    <th>Path</th>
  </tr>
  {#each plugins() as item}
  <tr class="items">
    <td>
      <label data-item={item.name}>
        <input type="checkbox"
        data-item={item.name}
        bind:checked={item.enabled}/>
        <span class="big">{item.name}</span>
      </label>
    </td>
    <td>{item.version}</td>
    <td>{item.path}</td>
  </tr>    
  {/each}
</table>
<div class="btn-container">
  <button on:click="{btnRestart}">[restart]</button>
</div>

<style>
table {
  border-collapse: collapse;
  font-family: Consolas, Lucida Console, Courier New, monospace;
  font-size: 12px;
  margin: 2px;
}
tr.items:hover {
  background: cornsilk;
}
th,td {
  border: 1px solid;
  padding: 0 5px;
}
label span {
  vertical-align: 3px;
}
.btn-container button {
  background: transparent;
  font-weight: 700;
  font-size: 10px;
  cursor: pointer;
  padding: 2px;
  border: 0;
  color: red;
}
</style>