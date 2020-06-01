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

function filename(pathname, reqs, hash='') {
  const arr = pathname.split('/');
  let file = arr.pop();
  if (file==='') {
    file = '_';
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
  return arr.join('/');;
}

module.exports = (match, reqs) => {
  let {host, pathname: f, url} = match;
  let hash = '';
  if (match.route.hashQstring) {
    let [,params] = url.split('?');
    hash = params ? hashCode(params) : '';  
  }
  const fpath = filename(f, reqs, hash);

  const stamp1 = `${host}${fpath}`;
  const stamp2 = `${host}/$${fpath}`;

  const cache = `${mitm.home}/cache`;
  const fpath1 = `${cache}/${stamp1}`;
  const fpath2 = `${cache}/${stamp2}.json`;
  return {fpath1, fpath2};  
}
