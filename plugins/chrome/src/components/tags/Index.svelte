<script>
import { onMount } from 'svelte';
import { tags } from './stores.js';
import Button from './Button.svelte';

import VBox2 from '../box/VBox2.svelte';
import Content from './Content.svelte';
import List from './List.svelte';

let left = 165;
const top = '47';
const title = '-List-' 
const id = 'routeLeft';

onMount(async () => {

});

function dragend({detail}) {
  left = detail.left
}

function onChange(e) {

}
</script>

<Button/>
{#if $tags.list}
  <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>
    <Content {left} {onChange}/>
  </VBox2>
{:else}  
  <Content {onChange}/>
{/if}
