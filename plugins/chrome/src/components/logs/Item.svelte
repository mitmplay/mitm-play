<script>
export let item;

import { logstore } from './stores.js';
import { client } from '../other/stores.js';

const m = {
  POST:  'post',
  PUT:   'put ',
  GET:   'get ',
  DELETE:'del ',
}

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
    const o = window.mitm.files.log[item.key][logid];
    const src = {
      respHeader: o.respHeader,
      response: '<empty>',
      headers: '<empty>',
      logid: logid,
      title: o.title,
      path: o.path,
      url: logid.replace(/^.+\.mitm-play/,'https://localhost:3005'),
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

function status({general:g}) {
  if (g===undefined) {
    return ''
  }
  return `_${Math.trunc(g.status/100)}`;
}

function status2({general:g}) {
  if (g===undefined) {
    return ''
  }
  return g.status;
}

function method({general:g}) {
  if (g===undefined) {
    return ''
  }
  return `${m[g.method]}`;
}

function method2({general:g}) {
  if (g===undefined) {
    return ''
  }
  return m[g.method] + (g.ext ? `<${g.ext.padEnd(4, ' ')}> ` : '');
}

function url({general:g}) {
  let msg
  if (g===undefined) {
    return ''
  }
  if (g.url.match('/log/')) {
    msg = g.url.split('@')[1];
  } else if ($client.nohostlogs) {
    msg = g.path;
  } else {
    msg = `${g.url.split('?')[0]}`;
  }
  if ($client.nohostlogs) {
    if (g.url.match('-sshot@')) {
      msg = g.url.split('~').pop()
    } else if (g.ext==='') {
      const [a1,a2] = msg.split('--');
      msg = a2 || a1;
    }
  } else if (g.url.match('-sshot@')) {
    msg = (new URL(msg)).pathname 
  }
  return msg;
}

function pth({general:g}) {
  if (g===undefined) {
    return ''
  }
  if ($client.noarglogs || g.url.match('/log/')) {
    return '';
  } else {
    const parms = g.url.split('?')[1];
    return parms ? `?${parms}` : '';
  }
}
</script>

<div class="td-item {$logstore.logid===item.logid}"
data-logid={item.logid}
on:click="{clickHandler}"
>
  <span class="status {status(item)}">{status2(item)}</span>
  <span class="method {method(item)}">{method2(item)}</span>
  <span class="url">{url(item)}</span>
  <span class="prm">{pth(item)}</span>
</div>

<style>
.td-item:hover {
  color: blue;
  background: yellow
  /* font-weight: bolder; */
}
.td-item {
  cursor: pointer;
  padding: 0.1rem;
  line-height: 15px;
  padding-left: 5px;
}
.td-item.true {
  color: blue;
  font-weight: bold;
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
.method.put {
  color: #7e26a7;
}
.method.post {
  color: #a7267f;
}
.method.delete {
  color: red;
}
.prm {
  color: #ccb7b7;
  margin-left: -6px;
}
</style>