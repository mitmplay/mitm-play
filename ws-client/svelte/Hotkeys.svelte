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
  const key = e.target.innerText
  const fn = mitm.macrokeys[key]
  let [typ, ...arr] = key.split(':')
  const opt = {}
  if (typ==='key') {
    const qctl = key.match(/<([^>]+)>/)
    const qalt = key.match(/{([^}]+)}/)
    let k
    if (qctl) {
      opt.altKey = true
      k = qctl[1].substr(-1)
    } else if (qalt) {
      k.ctrlKey = true
      k = qalt[1].substr(-1)
    } else {
      opt.altKey = true
      opt.ctrlKey = true
      k = arr.pop().substr(-1)
    }
    opt.shiftKey = e.shiftKey
    opt.code = `Key${k.toUpperCase()}`
    opt.key = mitm.fn.codeToChar(opt)
  } else if (typ==='code') {
    const qctl = key.match(/<([^>]+)>/)
    const qalt = key.match(/{([^}]+)}/)
    if (qctl) {
      opt.altKey = true
      arr = qctl[1].split(':')
    } else if (qalt) {
      opt.ctrlKey = true
      arr = qalt[1].split(':')
    } else {
      opt.altKey = true
      opt.ctrlKey = true
    }
    opt.code = arr.pop()
    opt.shiftKey = e.shiftKey
    opt.key = mitm.fn.codeToChar(opt)
  }
  if (fn) {
    const macro = fn(new KeyboardEvent('keydown', opt))
    mitm.fn.macroAutomation(macro)
    return true
  }
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