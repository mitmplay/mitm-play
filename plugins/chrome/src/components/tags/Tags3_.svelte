<script>
import { tags } from './stores.js';
import Tags31 from './Tags3_1.svelte';

function istag(ns) {
  const arr = Object.keys($tags.__tag2[ns]);
  return arr.filter(x=>!x.match(':')).length;
}
</script>

<td>
{#each Object.keys($tags.__tag3) as item}
  {#if istag(item)}
    <Tags31 items={$tags.__tag3[item]} key={item}/>
  {/if}
{/each}
</td>

<style>
</style>