<script>
import { source } from './stores.js';
import { Tab } from 'svelma';
</script>

<Tab label="Headers">
  <div class="show">
    <pre>{@html $source.headers}</pre>
  </div>  
</Tab>
<Tab label="Response">
  <div class="show">
    <pre>{@html $source.content}</pre>
  </div>
</Tab>

<style>
.show {
  font-size: 12px;
  height: calc(100vh - 55px);
  overflow: auto;
}
.show pre{
  padding: 0 0 0 5px;
}
</style>
