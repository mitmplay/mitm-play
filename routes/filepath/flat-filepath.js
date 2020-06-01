const _ext = require('./ext');

function filename(pathname, resp) {
  const arr = pathname.replace(/\-/g, '_').split('/');
  
  let file = arr.pop();
  if (file==='') {
    file = '_';
  }
  
  let ext = '';
  let file2 = file.split('.');
  if (file2.length===1) {
    ext = _ext(resp);
  } else {
    ext = file2[1];
  }

  file2.push(ext);  
  arr.push(file2[0]);
  const fpath = arr.join('-');
  return {fpath, ext};
}

module.exports = (match, resp, stamp) => {
  const {home, session} = mitm;
  const {host,pathname} = match;
  const {fpath, ext} = filename(pathname, resp);
  const fpath1 = `${home}/log/${session}/${stamp}-${host}-${fpath}.${ext}`;
  const fpath2 = `${home}/log/${session}/$/${stamp}-${host}-${fpath}.json`;
  return {fpath1, fpath2, ext};
}
