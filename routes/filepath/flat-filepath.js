const {fileWithHash} = require('./file-util');
const _ext = require('./ext');

function filename(pathname, resp) {
  const arr = pathname.replace(/\-/g, '_').split('/');
  
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
  return {fpath: arr.join('-'), ext};
}

module.exports = (match, resp, stamp) => {
  let {host,pathname,route:{at,contentType}} = match;
  const {home, session, argv: {group}} = global.mitm;
  const {fpath, ext} = filename(pathname, resp);
  const json = ext==='json' ? '' : '.json';

  if (at===undefined) {
    at = contentType.join('-');
  }

  let root;
  if (group) {
    root = `${home}/_group/${group}/log`;
  } else {
    root = `${home}/log`;
  }

  let fpath1,fpath2;
  if (at.match(/^\^/)) {
    at = at.slice(1);
    fpath1 = `${root}/${session}/${at}/${stamp}-${host}-${fpath}`;
    fpath2 = `${root}/${session}/${at}/$/${stamp}-${host}-${fpath}${json}`;
  } else {
    fpath1 = `${root}/${session}/${stamp}--${at}@${host}-${fpath}`;
    fpath2 = `${root}/${session}/$/${stamp}--${at}@${host}-${fpath}${json}`;
  }
  return {fpath1, fpath2, ext};
}
