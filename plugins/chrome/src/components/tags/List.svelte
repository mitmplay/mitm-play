<script>
export let onChange;

import { onMount } from 'svelte';
import Item from './Item.svelte';

let rerender = 0;
let data = [];

$: _data = data;

onMount(async () => {

});

const profileHandler = obj => {

}

// window.mitm.files.tags_events.profileTable = () => {

// }
</script>

{#each Object.keys(_data) as item}
  <Item item={{element: item, ..._data[item]}} {onChange}/>
{/each}
