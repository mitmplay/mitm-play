<script>
//https://c0bra.github.io/svelma/install
import { onMount } from 'svelte';

import { Tabs, Tab } from 'svelma';
import Route from './components/route/Index.svelte';
import Profile from './components/profile/Index.svelte'; // feat: profile
import LogsTab from './components/logs/Index.svelte';
import TagsTab from './components/tags/Index.svelte';
import Other from './components/other/Index.svelte';
import Help from './components/help/Index.svelte';

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
  <Tab label="Route"><Route/></Tab>
  <Tab label="Profile"><Profile/></Tab>
  <Tab label="Logs"><LogsTab/></Tab>
  <Tab label="Tags"><TagsTab/></Tab>
  <Tab label="Other"><Other/></Tab>
  <Tab label="Help"><Help/></Tab>
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