const {root, filename} = require('./file-util');

module.exports = ({match, reqs}) => {
  let {host, namespace, route: {at, path, file}} = match;
  const fpath = filename(match);
  const {argv} = global.mitm;
  let fpath1, fpath2;

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
  const {method} = reqs;
  if (file) {
    let id = 1;
    for (let key of match.arr.slice(1)) {
      file = file.replace(`:${id}`, key);
      id++;
    }
    fpath1 = `${_root}/${file}~${method}`;
    fpath2 = `${_root}/$/${file}~${method}.json`;  
  } else {
    fpath1 = `${_root}/${stamp1}~${method}`;
    fpath2 = `${_root}/${stamp2}~${method}.json`;  
  }
  return {fpath1, fpath2};  
}
