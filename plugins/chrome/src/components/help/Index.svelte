<script>
import { onMount } from 'svelte';
import { source } from './stores.js';

import VBox2 from '../box/VBox2.svelte';
import Content from './Content.svelte';
import List from './List.svelte';

let rerender = 0;
let left = 165;
let data = [];
let title='-Help-'

$: _data = data;

onMount(async () => {
  console.warn('onMount markdown');
  _ws_connect.markdownOnMount = () => ws__send('getMarkdown', '', markdownHandler);

  chrome.storage.local.get('helpLeft', function(opt) {
    opt.helpLeft && (left = opt.helpLeft)
  });
});

function dragend({detail}) {
  chrome.storage.local.set({helpLeft: detail.left})
}

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
</script>

<VBox2 {title} {left} {dragend} {List}>
  <Content/>
</VBox2>
