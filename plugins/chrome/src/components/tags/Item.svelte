<script> // feat: profile
// import { source } from './stores.js';

export let item;
export let onChange;

function clickHandler(e) {

}
</script>

<div class="td-item {$source.fpath===item.fpath}"
  data-item={item.element}
  on:click="{clickHandler}"
>{item.title}</div>

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
