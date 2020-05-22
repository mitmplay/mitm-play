const fs = require('fs-extra');
const fg = require('fast-glob');
const stringify = require('./stringify');

function tldomain(fullpath) {
  let fp;
  if (fullpath.match(/^chrome/)) {
    return fullpath;
  }
  try {
    fp = fullpath.
    match(/^\w+:\/\/([\w.]+)/)[1].
    split('.').reverse().
    slice(0,2).reverse().
    join('.');    
  } catch (error) {
    console.log('Error tldomain', error);
  }
  return fp;
}

function routeSet(routes, namespace, print=false) {
  const msg = `>> ${namespace}\n${stringify(routes)}`;
  mitm.routes[namespace] = routes;
  print && console.log(msg);
  return routes;
};

function clear() {
  const {clear:c} = global.mitm.argv;
  (c===true || c==='cache') && fs.remove(`${mitm.home}/cache`);
  (c===true || c==='log') && fs.remove(`${mitm.home}/log`);
}

const hello = function() {
  console.log('Hello from mimt-play');
};

const mock = function() {
  return {body: 'Hi there!'}
};

const resp = () => {};

module.exports = () => {
  global.mitm.fn.stringify = stringify;
  global.mitm.fn.tldomain = tldomain;
  global.mitm.fn.routeSet = routeSet;
  global.mitm.fn.clear = clear;
  global.mitm.fn.hello = hello;
  global.mitm.fn.mock = mock;
  global.mitm.fn.resp = resp;
  global.mitm.fn.fg = fg;
  global.mitm.fn.fs = fs;
}
