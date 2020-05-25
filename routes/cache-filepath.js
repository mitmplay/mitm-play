function filename(pathname, reqs, hash='') {
  const accept = reqs.headers.accept || '';
  const secFet = reqs.headers['sec-fetch-dest'] || '';
  const arr = pathname.split('/');
  let file = arr.pop();
  if (file==='') {
    file = '_';
  }
  let ext = '';
  let file2 = file.split('.');
  if (hash) {
    file2[0] = `${file2[0]}${hash}`;
  }
  if (file2.length===1) {
    if (accept.indexOf('html')>-1) {
      ext = 'html';
    } else if (accept.indexOf('css')>-1) {
      ext = 'css';
    } else if (secFet.indexOf('script')>-1) {
      ext = 'js';
    }
  } else {
    ext = file2[1];
  }
  file2.push(ext);
  arr.push(file2[0]);
  const fpath = arr.join('/');
  return {fpath, ext};
}

function hashCode(txt) {
  var hash = 0;
  if (txt.length == 0) {
      return '';
  }
  for (var i = 0; i < txt.length; i++) {
      var char = txt.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash+'';
}

module.exports = (match, reqs) => {
  let {host, pathname: f, url} = match;
  let hash = '';
  if (match.route.hashQstring) {
    let [,params] = url.split('?');
    hash = params ? hashCode(params) : '';  
  }
  const {fpath, ext} = filename(f, reqs, hash);

  const stamp1 = `${host}${fpath}`;
  const stamp2 = `${host}/$${fpath}`;

  const cache = `${mitm.home}/cache`;
  const fpath1 = `${cache}/${stamp1}.${ext}`;
  const fpath2 = `${cache}/${stamp2}.json`;
  return {fpath1, fpath2, ext};  
}
