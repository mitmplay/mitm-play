<script>
import Urls from './Urls.svelte';
import { eurls } from './stores.js';

function clicked(e) {
  const expanded = !$eurls.expanded
  if (expanded) {
    const nodes = document.querySelectorAll(`.tags-effect>details[open]`)
    nodes.forEach(node => node.removeAttribute('open'))
    setTimeout(() => {
      eurls.set({expanded})      
    }, 0);
  } else {
    eurls.set({expanded})
  }
}
</script>

{#if $eurls.expanded}
<details class="urls" open="true">
  {@html '<style id="urls"></style>'}
  <summary on:click={clicked}>Effected Url(s)</summary>
  <Urls/>
</details>
{:else}
<details class="urls">
  {@html '<style id="urls"></style>'}
  <summary on:click={clicked}>Effected Url(s)</summary>
  <Urls/>
</details>
{/if}

<style>
details, summary {
  outline: none;
}
summary {
  border: none;
  cursor: pointer;
  font-size: 13px;
  padding-left: 5px;
  background: #fdaaaa;
}
.urls summary:hover {
  background-color: #f1f6fbbd;
}
.urls {
  height: 100%;
  display: flex;
  overflow: auto;
  flex-direction: column;
}
.urls summary {
  position: sticky;
  background: white;
  top: 0px;
}
</style>
