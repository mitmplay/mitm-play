<script>
  import { onMount } from 'svelte';
  import { cfg, resize } from '../monaco/init';

  export let onChange;

  onMount(async () => {
    function initCodeEditor(src) {
      console.log('load monaco: route')
      const element = window.document.getElementById('monaco');
      const _route =  window.monaco.editor.create(element, cfg);
      const ro = new ResizeObserver(resize(_route))
      ro.observe(element);

      window.mitm.editor._route = _route;
      window.mitm.editor._routeEl = element;

      _route.onDidChangeModelContent(onChange);
      _route.setValue(src);
    }
    window.mitm.editor._routeEdit = initCodeEditor;
  });
</script>

<div class="edit-container">
  <div id="monaco"></div>
</div>
