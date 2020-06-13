const load = function(path) {
  const rpath = require.resolve(path);
  if (require.cache[rpath]) {
    delete require.cache[rpath];
  }
  return require(path);
}

const loadJS = function(path, log) {
  const {clear} = global.mitm.fn;
  console.log(log);
  load(path);
  clear();
}

module.exports = loadJS;
