<script>
  import { onMount } from 'svelte';
  import { cfg, resize } from '../monaco/init';
  const _c = 'color: blueviolet'

  export let onChange;

  onMount(async () => {
    function initCodeEditor(src) {
      const element = window.document.getElementById('profile');
      const _profile =  window.monaco.editor.create(element, cfg);
      const ro = new ResizeObserver(resize(_profile))
      ro.observe(element);

      console.log('%cRoute: Editor initilized!', _c)
      window.mitm.editor._profile = _profile;
      window.mitm.editor._profileEl = element;

      _profile.onDidChangeModelContent(onChange);
      _profile.setValue(src);
    }
    window.mitm.editor._profileEdit = initCodeEditor;
  });
</script>

<div class="edit-container">
  <div id="profile">
  </div>
</div>
