<script> // feat: markdown
import { source } from './stores.js';

export let item;

function clickHandler(e) {
  console.log(item);
  const {fpath} = item;
  ws__send('getMContent', {fpath}, ({content}) => {
    source.update(n => {
      return {
        ...n,
        content
      }
    })
  });
}
</script>

<tr class="tr">
  <td>
    <div class="td-item {$source.fpath===item.fpath}"
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
