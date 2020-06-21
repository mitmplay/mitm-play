<script>
import { source } from './stores.js';
export let item;

function empty() {
  source.set({
    element: '',
    title: '',
    path: '',
    url: '',
  })
}

function clickHandler(e) {
  const {item} = e.target.dataset;
  const obj = window.mitm.files.log[item];
  if (item===$source.element) {
    empty();
  } else {
    empty();
    setTimeout(() => {
      source.update(n => {
        return {
          element: item,
          title: obj.title,
          path: obj.path,
          url: item.replace(/^.+\.mitm-play/,'http://localhost:3000'),
        }
      })
    }, 1);
  }
}
</script>

<tr class="tr">
  <td>
    <div class="td-item {$source.element===item.element}"
    data-item={item.element}
    on:click="{clickHandler}"
    >{item.title}</div>
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
.td-item.true {
  color: blue;
  font-weight: bolder;
  background: aliceblue;
}
iframe {
  width: 100%;
  height: calc(100vh - 133px);
}
</style>