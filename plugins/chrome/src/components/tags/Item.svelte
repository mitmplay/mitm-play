<script> // feat: profile
import { tags } from './stores.js';

export let item;

function clickHandler(e) {
  let {route} = e.target.dataset;
  if (route===$tags.route) {
    route = ''
  }
  tags.set({
    ...$tags,
    route
  })
}
</script>

<div class="td-item {item.route===$tags.route}"
  data-route={item.route}
  on:click="{clickHandler}"
>{item.route}</div>

<style>
.td-item {
  cursor: pointer;
  padding: 0.1rem;
  line-height: 15px;
  padding-left: 5px;
  border-bottom: 1px solid #c0d8cca1;
}
.td-item.true {
  color: blue;
  font-weight: bolder;
  background: greenyellow;
}
</style>
