<script>
import { onMount } from 'svelte';
import { source } from './stores.js';

import VBox2 from '../box/VBox2.svelte';
import Content from './Content.svelte';
import List from './List.svelte';

let rerender = 0;
let markdown = 163;
let data = [];

$: _markdown = markdown;
$: _data = data;

onMount(async () => {
  console.warn('onMount markdown');
  _ws_connect.markdownOnMount = () => ws__send('getMarkdown', '', markdownHandler);

  chrome.storage.local.get('markdown', function(data) {
    data.markdown && (markdown = data.markdown);
  });
});

const markdownHandler = obj => {
  console.warn('ws__send(getMarkdown)', obj);
  if (window.mitm.files.markdown===undefined) {
    window.mitm.files.markdown = obj;
    data = obj;
  } else {
    const {markdown} = window.mitm.files;
    const newmarkdown = {};
    for (let k in obj) {
      newmarkdown[k] = markdown[k] ? markdown[k] : obj[k];
      newmarkdown[k].content = obj[k].content;
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

function dragend({detail}) {
  markdown = detail.left;
  chrome.storage.local.set({markdown})
}
</script>

<VBox2 title="-Help-" left={_markdown} {dragend} {List}>
  <Content/>
</VBox2>
