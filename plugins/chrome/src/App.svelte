<script>
//https://c0bra.github.io/svelma/install
import { onMount } from 'svelte';

import { Tabs, Tab } from 'svelma';
import TagsTable from './components/tags/Table.svelte';
import LogsTable from './components/logs/Table.svelte';
import RouteTable from './components/route/Table.svelte';
import ProfileTable from './components/profile/Table.svelte'; // feat: profile
import OtherTab from './components/other/Tab.svelte';

onMount(async () => {
  setTimeout(()=>{
    const node = document.querySelector('nav.tabs>ul');
    const li = document.createElement('LI');
    li.innerHTML = 'v'+window.mitm.version;
    li.classList.add('version');
    node.appendChild(li);
  }, 10);
})
</script>

<main class="main">
<Tabs style="is-boxed" size="is-small">
  <Tab label="Route"><RouteTable/></Tab>
  <Tab label="Profile"><ProfileTable/></Tab>
  <Tab label="Logs"><LogsTable/></Tab>
  <Tab label="Tags"><TagsTable/></Tab>
  <Tab label="Other"><OtherTab/></Tab>
  <!-- <Tab label="Monaco"><Editor/></Tab> -->
</Tabs>
</main>

<style>
	:global(li.version) {
    font-size: 10px;
    padding-top: 3px;
    padding-left: 5px;
    color: chocolate;
    font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
	}
</style>