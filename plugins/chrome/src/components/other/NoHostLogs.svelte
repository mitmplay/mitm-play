<script>
import { client } from './stores.js';

function btnNoHostLogs(e) {
  const nohostlogs = e.target.checked;
  client.update(n => {
    return {
      ...$client,
      nohostlogs,
    }
  });
  console.log($client);
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
  <input type="checkbox" on:click={btnNoHostLogs} checked={flag()}>
  No Host Logs
</label><br/>
