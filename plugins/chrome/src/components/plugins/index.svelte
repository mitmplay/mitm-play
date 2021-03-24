<script>
import Item from "../profile/Item.svelte";
import { onMount } from 'svelte';

let data = {};
$: _data = data;
let rerender = 0;

onMount(() => {
  data = window.mitm.plugins
});

function keys(dt, render) {
  return Object.keys(dt)
}

function btnRestart(e) {
  const {plugins} = window.mitm
  ws__send('restart', plugins)
}

function btnOpen(e) {
  const {path} = e.target.dataset;
  ws__send('openFolder', {path}, data => {
    console.log('Done Open!');
  });
}

function clicked(e) {
  const {dataset, checked} = e.target;
  setTimeout(()=>{
    const {item, path} = dataset;
    const [group1, id1] = path.split('~');
    console.log({checked, item, path})
    if (checked) {
      for (const pth in _data) {
        const obj = data[pth]
        if (pth!==path) {
          const [group2, id2] = pth.split('~');
          if (group1===group2 & obj.enabled) {
            console.log('*', obj)
            obj.enabled = false
            rerender++
          }
        }
      }
    }
  }, 10)
}
</script>

<table>
  <tr>
    <th>Name</th>
    <th>Path</th>
    <th>Version</th>
  </tr>
  {#each keys(_data, rerender) as pth}
  <tr class="items">
    <td>
      <label data-item={_data[pth].name}>
        <input type="checkbox"
        data-item={_data[pth].name}
        data-path={pth}
        on:click={clicked}
        bind:checked={_data[pth].enabled}/>
        <span class="big">{_data[pth].name}</span>
      </label>
    </td>
    <td>
      <span
        class="path"
        data-path={pth}
        on:click={btnOpen}>
        {pth}
      </span>
    </td>
    <td>{_data[pth].version}</td>
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
th {
  background: lightgray;
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
span.big:hover,
span.path:hover {
  cursor: pointer;
  text-decoration: underline;
}
.btn-container button {
  background: transparent;
  font-weight: 700;
  font-size: 10px;
  padding: 2px;
  border: 0;
  color: red;
}
</style>