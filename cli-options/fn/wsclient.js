const fs = require('fs-extra');

const rpath = require.resolve('../../socketclnt');

module.exports = function ({url}) {
  return fs.readFileSync(rpath)+'';
};
