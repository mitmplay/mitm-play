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
  if (show) {
    setTimeout(() => {
      const editor = CodeMirror.fromTextArea(document.getElementById("demotext"), {
        lineNumbers: true,
        mode: "javascript",
        matchBrackets: true
      });
    }, 1)
  }
}
</script>

<tr class="tr">
  <td>
    <div class="td-item {show}" data-item={item.element} on:click="{clickHandler}">
    {item.title} - {item.path}</div>
    {#if show}
    <div>
      <textarea id="demotext">{item.content}</textarea>
      <!-- <pre>{item.content}</pre> -->
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
