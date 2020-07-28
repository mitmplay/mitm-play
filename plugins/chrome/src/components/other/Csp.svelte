<script>
function btnCsp(e) {
  const csp = e.target.checked;
  ws__send('setClient', {csp}, data => {
    window.mitm.client.csp = data.csp;
    console.log('Done change state csp', data);
  });
}

function flag() {
  return window.mitm.client.csp;
}
</script>

<label class="checkbox">
  <input type="checkbox" on:click={btnCsp} checked={flag()}>
  Content Sec. Policy
</label><br/>
