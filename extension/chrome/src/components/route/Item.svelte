<script>
export let item;

let show = false;

function clickHandler(e) {
  let {item} = e.target.dataset;
  const obj = window.mitm.files.route[item];
  console.log(item, obj);
  if (obj) {
    obj.show = !obj.show;
    show = obj.show;
  }
}
</script>

<tr class="tr">
  <td>
    <div class="td-item {show}" data-item={item.element} on:click="{clickHandler}">{item.title}</div>
    {#if show}
    <div>
      <pre>{item.content}</pre>
    </div>
    {/if}
  </td>
</tr>

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
