<script>
import { source } from './stores.js';

export let item;
export let onChange;

function clickHandler(e) {
  let {item} = e.target.dataset;
  const { editor: { _route, _routeEdit }, files } = mitm;
  const url = mitm.routes[item].url;
  const obj = files.route[item];
  console.log(item, obj);

  if (_route===undefined) {
    _routeEdit(obj.content)
  } else {
    _route.setValue(obj.content || '');
    _route.revealLine(1);
  }
  setTimeout(() => {
    onChange(false);

    source.update(n => {
      return {
        ...n,
        goDisabled: (url===undefined),
        content: obj.content,
        fpath: obj.fpath,
        path: obj.path,
        item,
      }
    }, 1);
  })
}
</script>

<tr class="tr">
  <td>
    <div class="td-item {$source.path===item.path}"
      data-item={item.element}
      on:click="{clickHandler}"
    >{item.title}</div>
  </td>
</tr>

<style>
.td-item:hover {
  color: blue;
  font-weight: bolder;
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
  background: greenyellow;
}
</style>
