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
    <img src="{$logstore.url}" alt="image"/>
  {:else if $logstore.title.match('.json')}
    <Json/>
  {:else if $logstore.title.match('.html')}
    <Html/>
  {:else if $logstore.title.match('.txt')}
    <Text/>
  {:else if $logstore.title.match('.css')}
    <Css/>
  {:else if $logstore.title.match('.js')}
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
