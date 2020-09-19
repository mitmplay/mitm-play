const setlogs = require('./setlogs');
/**
 * update global.mitm.__tag4 to contain all namespaces which having tags
 * if namespace contain only typTags, it will having empty object 
 * this empty object is required for typTags (routes/match.js) 
 * to work on _global_ tag properly
 * 
 * @param {namespace} _ns 
 */
const tags = function(_ns) {
  const tag4 = {};
  let tag2 = {};
  if (_ns) {
    tag2[_ns] = global.mitm.__tag2[_ns];
  } else {
    tag2 = {...global.mitm.__tag2};
  }
  for (let namespace in tag2) {
    const ns = tag2[namespace];
    const node = {};
    tag4[namespace] = node;
    for (let id in ns) {
      const [typ, tag] = id.split(':');
      if (tag && ns[id]) {
        if (node[typ]===undefined) {
          node[typ] = [typ];
        }
        node[typ].push(id);
      }
    }
  }
  if (_ns) {
    if (tag4[_ns]) {
      global.mitm.__tag4[_ns] = tag4[_ns];
    }
  } else {
    global.mitm.__tag4 = tag4;
  }
  setlogs();
}

module.exports = tags;
