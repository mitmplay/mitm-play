<script>
import { onMount } from 'svelte';
import Item from './Item.svelte';
import Summary from './Summary.svelte';
const _c = 'color: blueviolet'

let rerender = 0;
let allhide = '';
let data = [];

$: _data = data;

onMount(async () => {
  console.log('%cHelp: onMount help/list', _c);
  _ws_connect.markdownOnMount = () => ws__send('getMarkdown', '', markdownHandler);
});

const markdownHandler = obj => {
  console.log('%cHelp: ws__send(getMarkdown)', _c, obj);
  if (window.mitm.files.markdown===undefined) {
    window.mitm.files.markdown = obj;
    data = obj;
  } else {
    const {markdown} = window.mitm.files;
    const newmarkdown = {};
    for (let k in obj) {
      newmarkdown[k] = obj[k];
    }
    data = newmarkdown;
    window.mitm.files.markdown = newmarkdown
  }
  /**
   * event handler after receiving ws packet
   * ie: window.mitm.files.getProfile_events = {eventObject...}
   */
  const {getProfile_events} = window.mitm.files;
  for (let key in getProfile_events) {
    getProfile_events[key](data);
  }
  rerender = rerender + 1;
}

window.mitm.files.markdown_events.markdownTable = () => {
  console.log('markdownTable getting called!!!');
  window.ws__send('getMarkdown', '', markdownHandler);
}

function expand(e) {
  const {open} = e.target.parentNode.parentNode.attributes
  allhide = (open === undefined ? 'allhide' : '')
}

</script>

<div id="list-help">
  {#each Object.keys(_data) as key, i}
    {#if key==='_readme_'}
      <div class="readme {allhide}">
        {#each Object.keys(_data[key]) as item}
          <Item item={{element: item, ..._data[key][item]}}/>
        {/each}    
      </div>
    {:else}
      <details class="{allhide}">
        <Summary item={_data[key]} {key} {expand} />
        {#each Object.keys(_data[key]) as item}
          <Item item={{element: item, ..._data[key][item]}}/>
        {/each}
      </details>  
    {/if}
  {/each}
</div>
