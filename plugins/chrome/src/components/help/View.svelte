<script>
import { source } from './stores.js';
</script>

<div class="show-container">
  <div id="markdown">
    {@html $source.content}
  </div>
</div>

<style>
  .show-container {
    position: relative;
    height: calc(100vh - 25px);  
    overflow: auto;
  }
</style>