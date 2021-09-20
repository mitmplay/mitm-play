<script>
import { onMount, onDestroy } from 'svelte';
const _c = 'color: blueviolet'

let keys = []
$: _keys = keys

function reloadKeys() {
  console.log('%cReload hotkeys.', _c);
  const {macrokeys: mkey} = window.mitm
  keys = []
  for (const id in mkey) {
    keys.push({id, title: mkey[id]._title})
  }
}

let observer
onMount(async () => {
  const qry = '.mitm-container.center'
  const node = document.querySelector(qry)
  const nodeVisible = obs => {
    if (node.attributes.style) {
      reloadKeys()
    }
  }
  observer = new MutationObserver(nodeVisible);
  observer.observe(node, {attributes: true})
  setTimeout(reloadKeys, 1000)
});

onDestroy(() => {
  if (observer) {
    observer.disconnect()
    observer = undefined
  }
});

function handleClick(e) {
  document.body.click()
  const key = e.target.innerText
  const fn = mitm.macrokeys[key]
  const [typ, ...arr] = key.split(':')
  const opt = {}
  if (typ==='key') {
    const k = arr.pop().substr(-1)
    opt.code = 'Key' + k.toUpperCase()
    opt.key = k
  } else if (typ==='code') {
    const c = arr.pop()
    const k = c.substr(-1).toLowerCase()
    opt.code = c
    opt.key  = k
  }
  fn && fn(new KeyboardEvent('keydown', opt))
}
</script>

<div class="vbox">
  <b>Hot-keys:</b>
  <table>
    {#each _keys as obj,i}
      <tr>
        <td class="no">{i+1}</td>
        <td class="kcode" on:click={handleClick}>
          {obj.id}
        </td>
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
    tr:hover {
      background: rgba(199, 166, 116, 0.452);
      .kcode {
        text-decoration: underline;
        &:hover {
          color: red;
          cursor: pointer;
        }
      }
    }
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
    }
    .title {
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
      width: calc(100% - 100px);
    }
  }
</style>