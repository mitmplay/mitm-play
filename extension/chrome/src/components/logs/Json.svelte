<script>
import { source } from './stores.js';
import { Tabs, Tab } from 'svelma';
</script>

<Tabs style="is-boxed" size="is-small">
  <Tab label="Headers">
    <div class="show-json">
      <pre>{@html $source.headers}</pre>
    </div>  
  </Tab>
  <Tab label="Response">
    <div class="show-json">
      <pre>{@html $source.content}</pre>
    </div>
  </Tab>
</Tabs>


<style>
.show-json {
  font-size: 12px;
  height: calc(100vh - 55px);
  overflow: auto;
}
.show-json pre{
  padding: 0 0 0 5px;
}
</style>
