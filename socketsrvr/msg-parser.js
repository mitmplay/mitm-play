const _global = require('./global');
const _client = require('./client');

// accessible from client
const wscmd = {
  ..._global(),
  ..._client(),
}
global.mitm.wscmd = wscmd;

module.exports = (client, msg) => {
  console.log('received: "%s"', msg);
  const arr = msg.replace(/\s+$/, '').match(/^ *(\w+) *(\{.*)/);
  if (arr) {
    let [,cmd,json] = arr;
    try {
      if (typeof(json)==='string') {
        json = JSON.parse(json);
      }
    } catch (error) {
      console.error(json,error);
    }        
    if (wscmd[cmd]) {
      wscmd[cmd].call(client, json)
    }
  }
}
