<script>
export let cols=3
import { states } from './states.js';

function resize(e) {
  const all = {...$states}
  all.chevron = all.chevron==='[<<]' ? '[>>]' : '[<<]'
  states.set(all)
}
</script>

<button
class="f-right" 
on:click="{resize}"
style="{cols===3 ? '' : 'display:none;'}"
>{$states.chevron}</button>

<style>
button {
  border: 0;
  cursor: pointer;
  color: #002aff;
  margin-top: -5px;
  margin-right: -5px;
  vertical-align: middle;
  background: transparent;
  padding: 2px 1px 1px 1px;
  font-family: Consolas, Lucida Console, Courier New, monospace;
  font-weight: 700;
  font-size: 10px;
}
.f-right {
  float:right;
  margin: 0;
}
</style>