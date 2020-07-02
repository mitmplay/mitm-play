<script>
import { source } from './stores.js';

function btnClear(e) {
  ws__send('clearLogs', '', data => {
    console.log('Done Clear!');
  });
}
</script>

<div class="btn-container">
<button class="btn-clear" disabled={$source.goDisabled} on:click="{btnClear}"  >Clear</button>
</div>

<style>
.btn-container {
  right: 0;
  top: 1px;
  position: absolute;
  margin-top: -1px;
  padding-right: 4px;
  padding-bottom: 3px;  
}
.btn-container button {
  font-size: 10px;
}
</style>
