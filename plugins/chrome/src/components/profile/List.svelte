<script>
export let onChange;

import { onMount } from 'svelte';
import Item from './Item.svelte';
const _c = 'color: blueviolet'

let rerender = 0;
let data = [];

$: _data = data;

onMount(async () => {
  console.log('%cProfile: onMount profile/list', _c);
  _ws_connect.profileOnMount = () => ws__send('getProfile', '', profileHandler);
});

const profileHandler = obj => {
  console.log('%cProfile: ws__send(getProfile)', _c, obj);
  if (window.mitm.files.profile===undefined) {
    window.mitm.files.profile = obj;
    data = obj;
  } else {
    const {profile} = window.mitm.files;
    const newprofile = {};
    for (let k in obj) {
      newprofile[k] = profile[k] ? profile[k] : obj[k];
      newprofile[k].content = obj[k].content;
    }
    data = newprofile;
    window.mitm.files.profile = newprofile
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

window.mitm.files.profile_events.profileTable = () => {
  console.log('profileTable getting called!!!');
  window.ws__send('getProfile', '', profileHandler);
}
</script>

{#each Object.keys(_data) as item}
  <Item item={{element: item, ..._data[item]}} {onChange}/>
{/each}
