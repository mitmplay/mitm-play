<script>
import { onMount } from 'svelte';
// import { source } from './stores.js';

import VBox2 from '../box/VBox2.svelte';
import Content from './Content.svelte';
import List from './List.svelte';

let left = 165;
const top = '47';
const title = '-Tag(s)-' 
const id = 'routeLeft';

onMount(async () => {

});

function dragend({detail}) {

}

function onChange(e) {

}
</script>

<Content {onChange}/>
<!-- <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>
  <Content {onChange}/>
</VBox2> -->
