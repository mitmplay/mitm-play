<style>
.td-item:hover {
  background: greenyellow;
}
td {
  border: 1px solid #999;
}
.td-item,
.td-show {
  cursor: pointer;
  padding: 0.1rem;
}
iframe {
  width: 100%;
  height: calc(100vh - 133px);
}
</style>

<script>
//import { show } from './stores.js';
export let item;

let show = false;

function clickHandler(e) {
  let {item} = e.target.dataset;
  const obj = window.mitm.files.log[item];
  console.log(item, obj);
  if (obj) {
    obj.show = !obj.show;
    show = obj.show;
  }
}
</script>

<tr class="tr">
  <td>
    <div class="td-item" data-item={item.element} on:click="{clickHandler}">{item.title}</div>
    {#if show}
    <div>
    {#if item.title.match('.png')}
      <img src="{item.element.replace(/^.+\.mitm-play/,'http://localhost:3000')}"
       data-item={item.element} on:click="{clickHandler}"
       class="td-show"
       alt="image"/>
    {:else if item.title.match('.json')}
      <iframe title="json" src="{item.element.replace(/^.+\.mitm-play/,'http://localhost:3000')}" frameborder="0"></iframe>
    {:else}
      <button>X</button>
    {/if}
    </div>
    {/if}
  </td>
</tr>
