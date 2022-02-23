<script>
import { onMount } from 'svelte';
import Item from './Item.svelte';
import Summary from './Summary.svelte';
const _c = 'color: blueviolet'

let rerender = 0;
let open = '';
let data = [];

$: _data = data;
$: _open = open;

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
  setTimeout(() => {
    const node = e.target.closest('details')
    open = (node.getAttribute('open') === '' ? 'open': '')
  }, 0);
}
</script>

<div id="list-help" class="{_open}">
  {#each Object.keys(_data).sort() as key, i}
    {#if key==='<b>A-Mitm-play</b>'}
      <div class="readme">
        {#each Object.keys(_data[key]) as item}
          <Item item={{element: item, ..._data[key][item]}}/>
        {/each}    
      </div>
    {:else}
      <details>
        <Summary item={_data[key]} {key} {expand} />
        {#each Object.keys(_data[key]) as item}
          <Item item={{element: item, ..._data[key][item]}}/>
        {/each}
      </details>  
    {/if}
  {/each}
</div>
