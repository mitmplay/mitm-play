<script>
import { source } from './stores.js';

</script>

<div id="show-json">
  <pre>{@html $source.content}</pre>
</div>

<style>
#show-json {
  font-size: 12px;
  height: calc(100vh - 31px);
  overflow: auto;
}
#show-json pre{
  padding: 0 0 0 5px;
}
</style>
