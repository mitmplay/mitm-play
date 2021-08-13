<script>
const _c = 'color: blueviolet'

function btnOpen() {
  ws__send('openHome', '', data => {
    console.log('%cOther: Done open home folder!', _c);
  });
}
</script>

<button on:click={btnOpen}>Open Home</button>
