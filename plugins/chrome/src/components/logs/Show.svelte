<script>
import { logstore } from './stores.js';
import Json from './Json.svelte';
import Html from './Html.svelte';
import Text from './Text.svelte';
import Css from './Css.svelte';
import Js from './Js.svelte';
</script>

<div class="item-show">
  {#if $logstore.title.match('.png')}
    <img src="{$logstore.url}" alt="screenshot"/>
  {:else if $logstore.ext==='json'}
    <Json/>
  {:else if $logstore.ext==='html'}
    <Html/>
  {:else if $logstore.ext==='txt'}
    <Text/>
  {:else if $logstore.ext==='css'}
    <Css/>
  {:else if $logstore.ext==='js'}
    <Js/>
  {:else}
    <pre>{$logstore.response}</pre>
  {/if}
</div>

<style>
.item-show {
  margin-left: 2px;
}
.item-show pre{
  padding: 0 0 0 5px;
}
</style>
