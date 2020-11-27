<script>
export let List;
export let left;
export let title;
export let dragend;
export let props = {};
export let height = "0";

import VBox from '../box/VBox.svelte';
import BStatic from '../box/BStatic.svelte';
import BResize from '../box/BResize.svelte';
import BHeader from '../box/BHeader.svelte';
import BTable from '../box/BTable.svelte';
</script>

<VBox>
  <BStatic {height}>
    <BHeader>{title}</BHeader>
    <BTable><svelte:component this={List} {...props}/></BTable>
  </BStatic>
  <BResize {left} on:dragend={dragend} {height}>
    <slot></slot>
  </BResize>
</VBox>
