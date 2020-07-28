<script>
function btnPostmessage(e) {
  const postmessage = e.target.checked;
  ws__send('setClient', {postmessage}, data => {
    window.mitm.client.postmessage = data.postmessage;
    console.log('Done change state postmessage', data);
  });
}

function flag() {
  return window.mitm.client.postmessage;
}
</script>

<label class="checkbox">
  <input type="checkbox" on:click={btnPostmessage} checked={flag()}>
  Post Messages
</label><br/>
