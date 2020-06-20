<style></style>

<script>
//https://c0bra.github.io/svelma/install
import { Tabs, Tab, Button } from 'svelma';
import LogsTable from './components/logs/Table.svelte';
let counter = 0;

</script>

<main class="main">
<Tabs style="is-boxed" size="is-small">
  <Tab label="Logs">
  <LogsTable/>
  </Tab>
  <Tab label="Cache">
	<h1>Tab 2!</h1>  
  </Tab>
  <Tab label="Others">
	<Button type="is-primary" on:click={() => counter++}>Click!: {counter}</Button>
  </Tab>
</Tabs>

</main>
