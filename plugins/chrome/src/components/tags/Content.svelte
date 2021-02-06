<script>
import { onMount } from 'svelte';
import { tags } from './stores.js';
import { states } from '../button/states.js';
import  Chevron from '../button/Chevron.svelte';
import BStatic from '../box/BStatic.svelte';
import BHeader from '../box/BHeader.svelte';
import BTable from '../box/BTable.svelte';
import Tags1 from './Tags1_.svelte'; 
import Tags2 from './Tags2_.svelte'; 
import Tags3 from './Tags3_.svelte'; 
import Effected from './Effected.svelte';

export let top = "23";
export let left;

let block = true;
let cols = 3;

onMount(async () => {
  console.warn('onMount tags/index');
});

window.mitm.files.getRoute_events.tagsTable = () => {
  // window.ws__send('getRoute', '', routeHandler);
  const {__tag1, __tag2, __tag3} = window.mitm;
  console.log('events.tagsTable...');
  const tgroup = {};
  for (let ns in __tag2) {
    const tsks = __tag2[ns]
    for (let task in tsks) {
      const [k,v] = task.split(':');
      if (v && k!=='url') {
        tgroup[v] = true
      }
    }
  } 
  tags.set({
    ...$tags,
    __tag1,
    __tag2,
    __tag3,
    tgroup,
  })
}
function oneClick(e) {
  const {_cols} = e.target.dataset;
  cols = +_cols;
}
function handleMessage(event) {
  const {all, name} = event.detail
  let q
  if (name==='state2') {
    all.chevron = all.state2 ? '[<<]' : '[<<]'
    all.state3 = {} // feat: auto collapsed between tag2 & tag3
    q = '.t3'
  } else if (name==='state3') {
    all.chevron = !all.state3 ? '[>>]' : '[>>]'
    all.state2 = {} // feat: auto collapsed between tag2 & tag3
    q = '.t2'
  }
  const nodes = document.querySelectorAll(`${q} details[open]`)
  nodes.forEach(node => node.removeAttribute('open'))  
  states.set(all)
}
</script>

<div class="vbox">
  <details open="true">
    <summary>Enable / Disable Tags</summary>
    <div class="vbox-1">
      <BStatic {top} {block}>
        <BHeader {left}>
          <button data-_cols=3 on:click="{oneClick}">[full]</button>
          <button data-_cols=2 on:click="{oneClick}">[two]</button>
          <button data-_cols=1 on:click="{oneClick}">[one]</button>
          <Chevron/>
        </BHeader>
        <BTable>
          <tr class="set-tags">
            <Tags1 {cols}/>
            <Tags2 {cols} on:message={handleMessage}/>
            <Tags3 {cols} on:message={handleMessage}/>
          </tr>
        </BTable>
      </BStatic>  
    </div>
  </details>
  <Effected/>
</div>

<style>
.vbox {
  flex: auto;
  display: flex;
  position: relative;
  flex-direction: column;
  height: calc(100vh - 23px);
  background-color: white;
}
.vbox-1 {
  margin-bottom: 10px;
}
details, summary {
  outline: none;
}
summary {
  border: none;
  cursor: pointer;
  font-size: 13px;
  padding-left: 5px;
  background: #fdaaaa;
}
button {
  border: 0;
  cursor: pointer;
  color: #002aff;
  margin-top: -5px;
  margin-right: -5px;
  vertical-align: 0.6px;
  background: transparent;
  padding: 2px 1px 1px 1px;
  font-family: Consolas, Lucida Console, Courier New, monospace;
  font-weight: 700;
  font-size: 10px;
}
</style>
