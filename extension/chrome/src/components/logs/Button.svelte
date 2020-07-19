<script>
import { logstore } from './stores.js';

function btnClear(e) {
  ws__send('clearLogs', {browserName: 'chromium'}, data => {
    console.log('Done Clear!');
  });
}
</script>

<div class="btn-container">
<button on:click="{btnClear}">
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 512 512"><path style="fill:red" d="M256 8C119.034 8 8 119.033 8 256s111.034 248 248 248 248-111.034 248-248S392.967 8 256 8zm130.108 117.892c65.448 65.448 70 165.481 20.677 235.637L150.47 105.216c70.204-49.356 170.226-44.735 235.638 20.676zM125.892 386.108c-65.448-65.448-70-165.481-20.677-235.637L361.53 406.784c-70.203 49.356-170.226 44.736-235.638-20.676z"/></svg>
</button>
</div>

<style>
.btn-container {
  position: absolute;
  margin-top: -1px;
  left: 70px;
  top: 1px;
}
button {
  border: 0;
  width: 26px;
  cursor: pointer;
  background: transparent;
}
</style>
