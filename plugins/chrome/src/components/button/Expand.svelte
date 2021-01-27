<script>
export let q;
export let name;
import { states } from './states.js';
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

function btnOpen(e) {
  const all = {...$states}
  all[name][q] = !all[name][q]
  const nodes = document.querySelectorAll(`${q} details`)
  if (all[name][q]) {
    nodes.forEach(node => node.setAttribute('open', ''))
  } else {
    nodes.forEach(node => node.removeAttribute('open'))
  }
  states.set(all)
  dispatch('message', {all, name}) // feat: auto collapsed between tag2 & tag3
}
</script>

<button on:click class="expand" on:click="{btnOpen}">[<b>+</b>]</button>

<style>
button {
  border: 0;
  cursor: pointer;
  color: #002aff;
  margin-top: -1px;
  margin-right: -5px;
  vertical-align: middle;
  background: transparent;
  padding: 1px 1px 2px 1px;
  font-family: Consolas, Lucida Console, Courier New, monospace;
  font-weight: 700;
  font-size: 10px;
}
</style>