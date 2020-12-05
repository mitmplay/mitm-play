<script>
import { source } from './stores.js';

let value = 61;
function plotValue(e) {
  value = +e.target.value
  const node = document.querySelector('#scale-mermaid')
  node.innerHTML = `.mermaid {height: ${value}vh;}`
}
</script>

<div class="btn-container">
  <span>{parseInt(value)}</span>
  <input name="weight" type="range" min="10" max="100" step="1" {value} on:input={plotValue} />
</div>

<style>
.btn-container {
  position: absolute;
  margin-top: 5px;
  padding-right: 4px;
  padding-bottom: 3px;
  right: 0;
  z-index: 5;
  top: -2px;
}
span {
  font-size: 0.8em;
  vertical-align: top;
}
</style>