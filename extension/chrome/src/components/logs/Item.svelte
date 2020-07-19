<script>
import { logstore } from './stores.js';
export let item;

function empty() {
  logstore.set({
    respHeader: {},
    response: '',
    headers: '',
    logid: '',
    title: '',
    path: '',
    url: '',
    ext: '',
  })
}

function clickHandler(e) {
  let {logid} = e.currentTarget.dataset;
  if (logid===$logstore.logid) {
    empty();
  } else {
    empty();
    const o = window.mitm.files.log[logid];
    const src = {
      respHeader: o.respHeader,
      response: '<empty>',
      headers: '<empty>',
      logid: logid,
      title: o.title,
      path: o.path,
      url: logid.replace(/^.+\.mitm-play/,'https://localhost:3001'),
      ext: o.ext,
    }
    if (o.title.match('.png')) {
      setTimeout(() => {
        logstore.update(n => src)
      }, 0);
    } else {
      ws__send('getContent', {fpath: logid}, ({headers, response, ext}) => {
        logstore.update(n => {
          return {
            ...src,
            response,
            headers,
            ext,
          }
        })
      })
    }
  }
}

function s({general:g}) {
  return `_${Math.trunc(g.status/100)}`;
}

function m({general:g}) {
  return `${g.method.toLowerCase()}`;
}
function m2({general:g}) {
  return g.method + (g.ext ? ` <${g.ext.toUpperCase()}> ` : '');
}
function u({general:g}) {
  if (g.url.match('/log/')) {
    return g.url.split('@')[1];
  } else {
    return `${g.url.split('?')[0]}`;
  }
}
function p({general:g}) {
  if (g.url.match('/log/')) {
    return '';
  } else {
    const parms = g.url.split('?')[1];
    return parms ? `?${parms}` : '';
  }
}
</script>

<tr class="tr">
  <td class="{item.logid ? 'selected' : ''}">
    <div class="td-item {$logstore.logid===item.logid}"
    data-logid={item.logid}
    on:click="{clickHandler}"
    >
      <span class="status {s(item)}">{item.general.status}</span> 
      <span class="method {m(item)}">{m2(item)}</span> 
      <span class="url">{u(item)}</span> 
      <span class="prm">{p(item)}</span> 
    </div>
  </td>
</tr>

<style>
.td-item:hover {
  color: blue;
  font-weight: bolder;
}
td {
  border-bottom: 3px solid #c0d8cca1;
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
}
.td-item,
.td-show {
  cursor: pointer;
  padding: 0.1rem;
  line-height: 15px;
  padding-left: 5px;
}
.td-item.true {
  color: blue;
  font-weight: bolder;
  background: greenyellow;
}
.status {
  color: green;
  font-weight: bold;
}
.status._4,
.status._5 {
  color: red;
}
.method {
  color: green;
  font-weight: bold;
}
.method.post {
  color: #a7267f;
}
.prm {
  color: #ccb7b7;
}
</style>