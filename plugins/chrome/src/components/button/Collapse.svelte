<script>
export let q;
export let name;
import { states } from './states.js';
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

function btnClose(e) {
  const all = {...$states}
  all[name][q] = false
  const nodes = document.querySelectorAll(`${q} details[open]`)
  nodes.forEach(node => node.removeAttribute('open'))
  states.set(all)
  dispatch('message', {all, name}) // feat: auto collapsed between tag2 & tag3

}
</script>

<button class="collapse" on:click="{btnClose}">[<b>-</b>]</button>

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