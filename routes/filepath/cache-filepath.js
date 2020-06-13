const {fileWithHash, hashCode} = require('./file-util');

function filename(pathname, reqs, hash='') {
  const arr = pathname.split('/');
  let file = arr.pop();
  if (file==='') {
    file = '_';
  } else {
    file = fileWithHash(file);
  }

  let file2 = file;
  let ext = file.match(/\.\w+$/)
  if (ext) {
    file2 = file.replace(/\.\w+$/, '');
  }
  if (hash) {
    file2 = `${file2}${hash}`;
  }
  arr.push(file2);
  return arr.join('/');
}

module.exports = (match, reqs) => {
  let {host, pathname: f, url, route: {at}} = match;
  let hash = '';
  if (match.route.querystring) {
    let [,params] = url.split('?');
    hash = params ? hashCode(params) : '';  
  }

  const fpath = filename(f, reqs, hash);
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

  const {group} = global.mitm.argv;
  let root ;
  if (group) {
    root = `${global.mitm.home}/_group/${group}/cache`;
  } else {
   
    root = `${global.mitm.home}/cache`;
  }
  
  const fpath1 = `${root}/${stamp1}`;
  const fpath2 = `${root}/${stamp2}.json`;
  return {fpath1, fpath2};  
}
