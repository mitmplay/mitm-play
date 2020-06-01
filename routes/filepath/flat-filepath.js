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
  let {host,pathname,route:{at}} = match;
  const {fpath, ext} = filename(pathname, resp);
  const json = ext==='json' ? '' : '.json';
  const {home, session} = mitm;

  let fpath1,fpath2;
  if (at.match(/^\^/)) {
    at = at.slice(1);
    fpath1 = `${home}/log/${session}/${at}/${stamp}-${host}-${fpath}`;
    fpath2 = `${home}/log/${session}/$/${at}/${stamp}-${host}-${fpath}${json}`;
  } else {
    fpath1 = `${home}/log/${session}/${stamp}--${at}@${host}-${fpath}`;
    fpath2 = `${home}/log/${session}/$/${stamp}--${at}@${host}-${fpath}${json}`;
  }
  return {fpath1, fpath2, ext};
}
