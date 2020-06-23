<style></style>

<script>
//https://c0bra.github.io/svelma/install
import { Tabs, Tab, Button } from 'svelma';
import LogsTable from './components/logs/Table.svelte';
import RouteTable from './components/route/Table.svelte';
import OtherTab from './components/other/Tab.svelte';

// import CacheTable from './components/cache/Table.svelte';

// let counter = 0;
</script>

<main class="main">
<Tabs style="is-boxed" size="is-small">
  <Tab label="Route"><RouteTable/></Tab>
  <Tab label="Logs"><LogsTable/></Tab>
  <!-- <Tab label="Other"><OtherTab/></Tab> -->
</Tabs>

</main>
<!-- <Tab label="Cache"><CacheTable/></Tab> -->
<!-- <Button type="is-primary" on:click={() => counter++}>Click!: {counter}</Button> -->