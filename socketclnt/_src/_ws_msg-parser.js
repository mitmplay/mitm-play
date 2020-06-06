const _ws_client = require('./_ws_client');
const _ws_wccmd = _ws_client();

module.exports = (event, msg) => {
  if (msg.length>40) {
    console.log('>> ws-message: `%s...`', msg.slice(0,40));
  } else {
    console.log('>> ws-message: `%s`', msg);
  }
  const arr = msg.replace(/\s+$/, '').match(/^ *([\w:]+) *(\{.*)/);
  if (arr) {
    let [,cmd,json] = arr;
    try {
      if (typeof(json)==='string') {
        json = JSON.parse(json);
      }
    } catch (error) {
      console.error(json,error);
    }        
    if (window._ws_queue[cmd]) {
      handler = window._ws_queue[cmd];
      delete window._ws_queue[cmd];
      handler(json.data);
    } else if (_ws_wccmd[cmd]) {
      console.log(json.data);
      _ws_wccmd[cmd].call(event, json)
    }       
  }    
}
