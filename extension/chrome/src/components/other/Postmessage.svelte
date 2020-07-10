<script>
function btnPostmessage(e) {
  ws__send('client', {postmessage: true}, data => {
    console.log('Done change state postmessage');
  });
}

</script>

<label class="checkbox">
  <input type="checkbox" on:click={btnPostmessage} checked={true}>
  Post Messages
</label><br/>
