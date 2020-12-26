<script>
import { source } from './stores.js';
export let item; 
export let key;

function klass(store) {
  for (const itm in item) {
    if (itm===store.fpath) {
      return 'chk'
    }
  }
  return ''
}
</script>    

<summary class="{klass($source)}">
  {@html key}
</summary>

<style>
  summary.chk {
    font-weight: 700;
    background: #e6f7d9;
  }
</style>
