<script>
export let List;
export let left;
export let title;
export let dragend;
export let show = 1;
export let props = {};
export let top = "0";

import VBox from '../box/VBox.svelte';
import BStatic from '../box/BStatic.svelte';
import BResize from '../box/BResize.svelte';
import BHeader from '../box/BHeader.svelte';
import BTable from '../box/BTable.svelte';
</script>

<VBox>
  <BStatic {top}>
    {#if title !== undefined}
    <BHeader>
      {#if typeof title === 'string'}
        {title}
      {:else}
        <svelte:component this={title}/>
      {/if}
    </BHeader>
    {/if}
    <div class="details-list"><svelte:component this={List} {...props}/></div>
  </BStatic>
  {#if show}
  <BResize {left} on:dragend={dragend} {top}>
    <slot></slot>
  </BResize>
  {/if}
</VBox>

<style>
  .details-list {
    margin-top: 19px;
    font-family: Consolas, Lucida Console, Courier New, monospace;
    font-size: 12px;
  }
</style>