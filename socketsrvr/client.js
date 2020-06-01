module.exports = () => {
  /**
   * use only by client
   */

  //ex: ws__help();
  //    => _help({})
  function _help() {
    let messages;
    const note = Object.keys(global.mitm.wscmd).map(x => {
      if (x.match(/^\$/)) {
        x = x.replace(/^\$/, '');
        messages = `ws__send('${x}',...)`;
      } else {
        messages = `ws_${x}(...)`;
      }
      return `* ${messages}`;  
    }).join('\n');
    const data = 
`Available functions:\n\n${note}\n
Double check on client implementation "ws_***()".
On browser console type "ws"`;
    const msg = `_help${JSON.stringify({data})}`
    console.log('_help', msg);
    this.send(msg);
  }

  //ex: ws__ping("there") 
  //    => _ping({data:"there"}) 
  function _ping(json) {
    let {data} = json;
    data = typeof(data)==='string' ? data : JSON.stringify(data);
    const msg = `_ping${JSON.stringify({data})}`
    console.log('_ping', msg);
    this.send(msg);
    return data;
  }

  //ex: ws__open({url: "https://google.com"})
  //    => _open({data:{url: "https://google.com"}})
  const _open = function(json) {
    const msg = `_open${JSON.stringify(json)}`
    console.log('_open', msg);
    this.send(msg);
  }

  //ex: ws__style({query: 'body', style: 'background: red;'})
  //    => _style({data:{query: 'body', style: 'background: red;'}})
  const _style = function(json) {
    let {data,_all} = json;
    data = `_style${JSON.stringify({data})}`
    console.log('_style', data);
    broadcast.call(this, {data,_all});
  }

  function $routes({data}) {
    
    const {stringify} = mitm.fn;

    if (data==='*') {
      return Object.keys(mitm.routes).map(x => {
        return `>> ${x}\n${stringify(mitm.routes[x])}`
      }).join('\n');
    } else if (!data) {
      return Object.keys(mitm.routes);
    } else {
      for (let id in mitm.routes) {
        if (id.match(data)) {
          const r = mitm.routes[id];
          return mitm.fn.stringify(r);
        }
      }
    }
  }

  async function _sshot({path}) {
    await global.mitm.page.screenshot({path});
  }

  let debunk;
  let _stamp = [];
  function $sshot({data}) {
    _stamp.push((new Date).toISOString().replace(/[:-]/g, ''));
    debunk && clearTimeout(debunk);
    debunk = setTimeout(function() {
      const stamp = _stamp[0];
      clearTimeout(debunk);
      _stamp = [];
      const {host} = data;
      const {home, session} = global.mitm;
      const path = `${home}/log/${session}/${stamp}-${host}-sshot.png`;
      _sshot({path});
    }, 500);
  }

  return {
    _style,
    _help,
    _ping,
    _open,
    $routes,
    $sshot,
  }
}
