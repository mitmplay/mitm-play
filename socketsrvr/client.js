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
    keys = Object.keys(mitm.routes);
    const {stringify} = mitm.fn;
    if (data) {
      return keys.map(x => {
        return `>> ${x}\n${stringify(mitm.routes[x])}`
      }).join('\n');
    } else {
      return keys;
    }
  }

  function $route({data}) {
    const r = mitm.routes[data];
    return mitm.fn.stringify(r);
  }

  return {
    _style,
    _help,
    _ping,
    _open,
    $routes,
    $route,
  }
}
