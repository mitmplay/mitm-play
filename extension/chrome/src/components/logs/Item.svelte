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
    }, 0);
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
  border-bottom: 3px solid #c0d8cca1;
}
.td-item,
.td-show {
  cursor: pointer;
  padding: 0.1rem;
  line-height: 15px;
  padding-left: 5px;
}
.td-item.true {
  color: blue;
  font-weight: bolder;
  background: aliceblue;
}
</style>