<script>
import { source } from './stores.js';
import Json from './Json.svelte';
import Html from './Html.svelte';
import Css from './Css.svelte';
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
