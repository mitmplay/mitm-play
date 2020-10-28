<script>
import { source } from './stores.js';
import { onMount } from 'svelte';

export let item;
export let onChange;

onMount(async () => {
  const { editor: { _route }} = window.mitm;
  const element = window.document.getElementById('monaco');
  const ro = new ResizeObserver(entries => {
    const {width: w, height: h} = entries[0].contentRect;
    _route && _route.layout({width: w, height: h})
  });
  ro.observe(element);

  window.mitm.editor._routeEl = element;
});

function initCodeEditor(src) {
  console.log('load monaco: route')
  const element = window.mitm.editor._routeEl;
  const _route =  window.monaco.editor.create(element, {
    language: 'javascript',
    // theme: "vs-dark",
    minimap: {
      enabled: false,
    },
    value: '',
  });
  window.mitm.editor._route = _route;

  _route.onDidChangeModelContent(onChange);
  _route.setValue(src);
}

function clickHandler(e) {
  let {item} = e.target.dataset;
  const url = mitm.routes[item].url;
  const { editor: { _route }, files } = window.mitm;
  const obj = files.route[item];
  console.log(item, obj);

  if (_route===undefined) {
    initCodeEditor(obj.content);
  } else {
    _route.setValue(obj.content || '');
    _route.revealLine(1);
  }
  setTimeout(() => {
    onChange(false);

    source.update(n => {
      return {
        ...n,
        goDisabled: (url===undefined),
        content: obj.content,
        path: obj.path,
        item,
      }
    }, 1);
  })
}
</script>

<tr class="tr">
  <td>
    <div class="td-item {$source.path===item.path}"
      data-item={item.element}
      on:click="{clickHandler}"
    >{item.title}</div>
  </td>
</tr>

<style>
.td-item:hover {
  color: blue;
  font-weight: bolder;
}
td {
  border-bottom: 3px solid #c0d8cca1;
}
.td-item,
.td-show {
  cursor: pointer;
  padding: 0.1rem;
  line-height: 15px;
  padding-left: 5px;  
}
.td-item.true {
  color: blue;
  font-weight: bolder;
  background: greenyellow;
}
</style>
