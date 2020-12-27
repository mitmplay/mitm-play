<script>
export let editor;
export let source;

function btnMin() {
  const monaco = window.mitm.editor[editor]
  monaco && monaco.trigger('fold', 'editor.foldAll');
}

function btnPlus() {
  const monaco = window.mitm.editor[editor]
  monaco && monaco.trigger('unfold', 'editor.unfoldAll');
}

function btnOpen() {
  console.log(source);
  ws__send('openFolder', source, data => {
    console.log('Done Open!');
  });
}
</script>

<button class="tlb btn-min"  on:click="{btnMin}" >[--]</button> -
<button class="tlb btn-plus" on:click="{btnPlus}">[++]</button> -
<button class="tlb btn-open" disabled={source.openDisabled} on:click="{btnOpen}">Open</button> -

<style>
button {
  border: 0;
  padding: 0;
  cursor: pointer;
  background: transparent;
  font-family: Consolas, Lucida Console, Courier New, monospace;
  font-size: 10px;
}
.tlb {
  border: none;
}
</style>
