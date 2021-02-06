<script>
import { tags } from './stores.js';
import Button from './Button.svelte';

import VBox2 from '../box/VBox2.svelte';
import Content from './Content.svelte';
import List from './List.svelte';

let left = 165;
const top = '47';
const title = '-Route(s)-' 
const id = 'routeLeft';

function dragend({detail}) {
  left = detail.left
}
</script>

<Button/>
{#if $tags.list}
  <VBox2 {title} {top} {left} {dragend} {List}>
    <Content {left}/>
  </VBox2>
{:else}  
  <Content/>
{/if}
