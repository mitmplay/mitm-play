<script>
function btnOpen() {
  ws__send('openHome', '', data => {
    console.log('Done open home folder!');
  });
}
</script>

<button on:click={btnOpen}>Open Home</button><br/>
