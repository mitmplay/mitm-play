const {fileWithHash} = require('./file-util');
const _ext = require('./ext');

function filename(pathname, resp, nanoid) {
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
    ext = ext[0];
  } else {
    ext = _ext(resp);
    file2 = `${file}.${ext}`;
  }
  arr.push(file2);
  return {fpath: arr.join('/'), ext};
}

module.exports = (match, resp, stamp) => {
  const {home, session} = mitm;
  const {host,pathname} = match;
  return function(nanoid='') {
    const {fpath, ext} = filename(pathname, resp, nanoid);
    const fpath1 = `${home}/log/${session}/${host}/${stamp}/${fpath}.${ext}`;
    const fpath2 = `${home}/log/${session}/${host}/$/${stamp}/${fpath}.json`;
    return {fpath1, fpath2, ext};  
  }
}
