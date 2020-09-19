const {root, filename} = require('./file-util');

module.exports = ({match, reqs}) => {
  let {host, namespace, route: {at, path}} = match;
  const fpath = filename(match);
  const {argv} = global.mitm;

  (at===undefined) && (at = '');

  let stamp1,stamp2;
  if (at.match(/^\^/)) {
    at = at.slice(1);
    stamp1 = `${at}/${host}${fpath}`;
    stamp2 = `${at}/${host}/$${fpath}`;
  } else {
    at && (at = `/${at}`);
    stamp1 = `${host}${at}${fpath}`;
    stamp2 = `${host}${at}/$${fpath}`;
  }
  let _root, fmatch;
  if (path && (fmatch = path.match(/^[\t ]*\.\/(.+)/))) {
    _root = `${argv.route}/${namespace}/${fmatch[1]}`;
  } else {
    _root = root(reqs, 'cache');
  }
  const fpath1 = `${_root}/${stamp1}`;
  const fpath2 = `${_root}/${stamp2}.json`;
  return {fpath1, fpath2};  
}
