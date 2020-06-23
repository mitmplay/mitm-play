const c = require('ansi-colors');
const _global = require('./global');
const _client = require('./client');
const $getLog = require('./_getLog');
const $getCache = require('./_getCache');
const $getRoute = require('./_getRoute');
const $saveRoute = require('./_saveRoute');
const $screencap = require('./_screencap');

// accessible from client
const wscmd = {
  ..._global(),
  ..._client(),
  $screencap,
  $saveRoute,
  $getRoute,
  $getCache,
  $getLog,
}
global.mitm.wscmd = wscmd;

module.exports = (client, msg) => {
  if (msg.match(/[?;]/)) {
    console.log(c.blue('>> ws-message: `%s...`'), msg.split(/[?;]/)[0]);
  } else {
    console.log(c.blue('>> ws-message: `%s`'), msg);
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
    if (wscmd[cmd]) {
      wscmd[cmd].call(client, json)
    } else {
      const cmd2 = `$${cmd.split(':')[0]}`;
      if (wscmd[cmd2]) {
        const data = wscmd[cmd2].call(client, json);
        client.send(`${cmd}${JSON.stringify({data})}`);
      }
    }
  }
}
