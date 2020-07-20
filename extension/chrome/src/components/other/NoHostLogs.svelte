<script>
function btnnohostlogs(e) {
  const nohostlogs = e.target.checked;
  ws__send('setClient', {nohostlogs}, data => {
    window.mitm.client.nohostlogs = data.nohostlogs;
    console.log('Done change state nohostlogs', data);
  });
}

function flag() {
  return window.mitm.client.nohostlogs;
}
</script>

<label class="checkbox">
  <input type="checkbox" on:click={btnnohostlogs} checked={flag()}>
  No Host Logs
</label><br/>
