function filename(pathname, reqs) {
  const accept = reqs.headers.accept || '';
  const secFet = reqs.headers['sec-fetch-dest'] || '';
  const arr = pathname.split('/');
  let file = arr.pop();
  if (file==='') {
    file = '_';
  }
  file2 = file.split('.');
  if (file2.length===1) {
    if (accept.indexOf('html')>-1) {
      file2.push('html');
    } else if (accept.indexOf('css')>-1) {
      file2.push('css');
    } else if (secFet.indexOf('script')>-1) {
      file2.push('js');
    }
  }
  arr.push(file2.join('.'));
  const fullpath = arr.join('/');
  // console.log('fullpath', pathname, fullpath);
  return fullpath;
}

module.exports = (match, reqs) => {
  const {host, pathname: f} = match;
  const fullpath = filename(f, reqs);

  const stamp1 = `${host}${fullpath}`;
  const stamp2 = `${host}/$${fullpath}`;

  const ex = match.route.ext || '';
  const cache = `${mitm.home}/cache`;
  const fpath1 = `${cache}/${stamp1}${ex}`;
  const fpath2 = `${cache}/${stamp2}.json`;
  return {fpath1, fpath2};  
}
