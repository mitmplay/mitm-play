<script>
import { source } from './stores.js';
import { Tabs, Tab } from 'svelma';

</script>

<Tabs style="is-boxed" size="is-small">
  <Tab label="Html">
    <div id="show-html">
      <pre>{@html $source.content}</pre>
    </div>  
  </Tab>
  <Tab label="Meta">Meta...</Tab>
</Tabs>

<style>
#show-html {
  font-size: 12px;
  height: calc(100vh - 55px);
  overflow: auto;
}
#show-html pre{
  padding: 0 0 0 5px;
}
</style>
