<script>
  import { onMount } from 'svelte';
  import { cfg, resize } from '../monaco/init';

  export let onChange;
  export let item;

  onMount(async () => {
    let { _route } = window.mitm.editor;
    if (!_route) {
      setTimeout(() => {
        console.log('load monaco: route')
        const element = window.document.getElementById('monaco');
        _route =  window.monaco.editor.create(element, cfg);
        const ro = new ResizeObserver(resize(_route))
        ro.observe(element);

        window.mitm.editor._route = _route;
        window.mitm.editor._routeEl = element;

        _route.onDidChangeModelContent(onChange);
      }, 1000)
    }
  });

  function reload(item) {
    const { _route } = window.mitm.editor;
    if (_route && item) {
      _route.setValue(mitm.files.route[item].content);
      _route.revealLine(1);      
    }
    return ''
  }
</script>

<div class="edit-container">
  <div id="monaco"></div>
</div>
{reload(item)}
