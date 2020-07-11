<script>
import { source } from './stores.js';
import Json from './Json.svelte';
import Html from './Html.svelte';
</script>

<div class="item-show">
  {#if $source.title.match('.png')}
    <img src="{$source.url}" alt="image"/>
  {:else if $source.title.match('.json')}
    <Json/>
  {:else if $source.title.match('.html')}
    <Html/>
  {:else}
    <pre>{$source.content}</pre>
  {/if}
</div>

<style>
.item-show {
  margin-left: 2px;
}
</style>
