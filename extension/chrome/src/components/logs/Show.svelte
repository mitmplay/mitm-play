<script>
import { source } from './stores.js';
import Json from './Json.svelte';
import Html from './Html.svelte';
import Css from './Css.svelte';
import Js from './Js.svelte';
</script>

<div class="item-show">
  {#if $source.title.match('.png')}
    <img src="{$source.url}" alt="image"/>
  {:else if $source.title.match('.json')}
    <Json/>
  {:else if $source.title.match('.html')}
    <Html/>
  {:else if $source.title.match('.css')}
    <Css/>
  {:else if $source.title.match('.js')}
    <Js/>
  {:else}
    <pre>{$source.content}</pre>
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
