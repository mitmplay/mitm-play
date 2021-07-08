<script>
import { tags } from './stores.js';
import Tags32 from './Tags3_2.svelte';
import Expand from '../button/Expand.svelte';
import Collapse from '../button/Collapse.svelte';
const {machMethod, removeMethod} = window.mitm.fn;

export let items;
export let ns;

let namespace;

function q(key) {
  return key.replace(/[@~.]/g, '-')
}
function btnExpand(e) {
  const node = e.target.parentElement
  setTimeout(() => {
    const exp = node.getAttribute('open')
    if (exp!==null) {
      const nodes = document.querySelectorAll(`#${node.id} details`)
      nodes.forEach(node => node.setAttribute('open', ''))
    }
  }, 0)
}
function xitems(tags) {
  const {__tag3} = tags;
  namespace = __tag3[ns];
  const { tmethod } = window.mitm.fn;
  const arr = Object.keys(namespace).sort((a,b)=> {
    a = a.match(tmethod) ? a.replace(tmethod,'') : a;
    b = b.match(tmethod) ? b.replace(tmethod,'') : b;
    return a<b ? -1 : (a>b ? 1 : 0);
  });
  return arr;
}
function xtags(path) {
  const { rclass } = window.mitm.fn;
  let secs = namespace[path];
  let arr = Object.keys(secs).filter(x=>x[0]!==':');
  let tag1 = {}
  const klass = arr.map(x=> {
    const arr = Object.keys(secs[x]);
    if (secs[x].tags) {
      tag1 = {...tag1, ...secs[x].tags}
    }
    return arr.map(x=>x.
        split(':').
        pop().
        replace(rclass, '-')
    ).join(' _')
  })
  tag1 = Object.keys(tag1)
  tag1 = tag1.length ? `_${tag1.join(' _').replace(/url:/g, '').replace(rclass, '-')}` : ''
  return `${tag1} _${klass.join(' _')}`;
}

</script>

<div class="border">
  <div class="space0">
    <!-- feat: auto collapsed between tag2 & tag3 -->
    <Collapse on:message name="state3" q="{`.t3.${q(ns)}`}"></Collapse>
    <Expand on:message name="state3" q="{`.t3.${q(ns)}`}"></Expand>
    <span class="ns">
      {#if ns.match('_global_')}
        [<span>{' * '}</span>]
      {:else}
        {ns.split('@').pop()}
      {/if}
    </span>
  </div>
  <div class="t3 {q(ns)}">
    {#each xitems($tags) as path, i}
    <details id="path{i}">
      <summary on:click="{btnExpand}" class="space1 {xtags(path)}">
        {#if machMethod(path)}
          <span class="no-method" title="{path}">{removeMethod(path)}</span>
          {#if $tags.mth}
            <span class="with-method">[{machMethod(path)[1]}]</span>
          {/if}
        {:else}
          <span class="generic">{path}</span>
        {/if}
      </summary>
      <Tags32 items={items[path]} {path} {ns}/>
    </details>
  {/each}

  </div>
</div>

<style>
.border {
  border: 1px solid;
}
.space0 {
  line-height: 1.5;
  font-size: 14px;
  font-family: serif;
  font-weight: bolder;
  background: lightgrey;
  color: darkblue;
}
summary>span {
  margin-left: -3px;
}
.space1 {
  font-size: 13px;
  font-family: serif;
  font-weight: bolder;
  color: blueviolet;
  padding-left: 3px;
}
span.ns span {
  vertical-align: -5px;
  line-height: 0.8;
  font-size: 18px;
}
span.no-method {
  color: red
}
span.with-method {
  color: coral;
  font-size: 9px;
}
</style>
