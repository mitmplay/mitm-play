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
  let {item} = e.currentTarget.dataset;
  if (item===$source.element) {
    empty();
  } else {
    empty();
    setTimeout(() => {
      const o = window.mitm.files.log[item];
      source.update(n => {
        return {
          element: item,
          title: o.title,
          path: o.path,
          url: item.replace(/^.+\.mitm-play/,'https://localhost:3001'),
        }
      })
    }, 0);
  }
}

function s({general:g}) {
  return `_${Math.trunc(g.status/100)}`;
}

function m({general:g}) {
  return `${g.method.toLowerCase()}`;
}
function u({general:g}) {
  return `${g.url.split('?')[0]}`;
}
function p({general:g}) {
  const parms = g.url.split('?')[1];
  return parms ? `?${parms}` : '';
}
</script>

<tr class="tr">
  <td>
    <div class="td-item {$source.element===item.element}"
    data-item={item.element}
    on:click="{clickHandler}"
    >
      <span class="status {s(item)}">{item.general.status}</span> 
      <span class="method {m(item)}">{item.general.method}</span> 
      <span class="url">{u(item)}</span> 
      <span class="prm">{p(item)}</span> 
    </div>
  </td>
</tr>

<style>
.td-item:hover {
  background: greenyellow;
}
td {
  border-bottom: 3px solid #c0d8cca1;
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
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
.status {
  color: green;
  font-weight: bold;
}
.status._4,
.status._5 {
  color: red;
}
.method {
  color: green;
  font-weight: bold;
}
.method.post {
  color: #a7267f;
}
.prm {
  color: #ccb7b7;
}
</style>