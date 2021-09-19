<script>
import { onMount } from 'svelte';
const _c = 'color: blueviolet'

let keys = []
$: _keys = keys 

onMount(async () => {
  console.log('%cMounted...', _c);
  setTimeout(()=>{
    const {macrokeys: mkey} = window.mitm
    keys = []
    for (const id in mkey) {
      keys.push({id, title: mkey[id]._title})
    }
  }, 1000)
});

</script>

<div class="vbox">
  <b>Hot-keys:</b>
  <table>
    {#each _keys as obj,i}
      <tr>
        <td class="no">{i+1}</td>
        <td class="kcode">{obj.id}</td>
        <td class="title">{obj.title}</td>
      </tr>
    {/each}
  </table>
</div>

<style type="text/scss">
  .vbox {
    padding: 0 10px;
    position: absolute;
    color:blue;
    left: 0;
    right: 0;
  }
  table {
    width: 100%;
    color: maroon;
    border-collapse: collapse;
    td {
      font-size: small;
      border: 1px solid #999;
      padding-left: 5px;
    }
    .no {
      padding: 0;
      width: 25px;
      text-align: center;
    }
    .kcode {
      font-family: 'Courier New', Courier, monospace;
      font-weight: bold;
      width: 100px;
    }
    .title {
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
      width: calc(100% - 100px);
    }
  }
</style>