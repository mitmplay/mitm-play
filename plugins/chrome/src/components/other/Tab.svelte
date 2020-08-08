<script>
import OpenHome from './OpenHome.svelte';
import CodeHome from './CodeHome.svelte';
import NoHostLogs from './NoHostLogs.svelte';
import Postmessage from './Postmessage.svelte';
import Csp from './Csp.svelte';
</script>

<ul>
<li><OpenHome/></li>
<li><CodeHome/></li>
<li><NoHostLogs/></li>
<li><Postmessage/></li>
<li><Csp/></li>
</ul>

<style>
ul {
  margin: 0 0 0 5px;
}
li {
  margin-bottom: 5px;
}
</style>
