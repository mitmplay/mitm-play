module.exports = () => {
  /**
   * use only by client
   */

  //ex: ws__help();
  //    => _help({})
  function _help() {
    const note = Object.keys(global.mitm.wscmd).map(x => {
      const messages = `ws_${x}()`;
      const spaces = ' '.repeat(14 - messages.length);
      return `* ${messages}${spaces} => ${x}()`;
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

  return {
    _style,
    _help,
    _ping,
    _open,
  }
}
