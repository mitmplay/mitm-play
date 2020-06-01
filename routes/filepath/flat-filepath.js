const _ext = require('./ext');

function filename(pathname, resp) {
  const arr = pathname.replace(/\-/g, '_').split('/');
  
  let file = arr.pop();
  if (file==='') {
    file = '_';
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
  return {fpath: arr.join('-'), ext};
}

module.exports = (match, resp, stamp) => {
  const {home, session} = mitm;
  const {host,pathname} = match;
  const {fpath, ext} = filename(pathname, resp);
  const fpath1 = `${home}/log/${session}/${stamp}-${host}-${fpath}.${ext}`;
  const fpath2 = `${home}/log/${session}/$/${stamp}-${host}-${fpath}.json`;
  return {fpath1, fpath2, ext};
}
