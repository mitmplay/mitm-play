<script>
function btnCode() {
  ws__send('codeHome', '', data => {
    console.log('Done code home folder!');
  });
}
</script>

<button on:click={btnCode}>Code Home</button>
