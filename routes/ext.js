module.exports = (resp) => {
  let ext = '';
  let ctype = resp.headers['content-type'];
  if (ctype) {
    ctype = ctype[0];
    if (ctype.indexOf('html')>-1) {
      ext = 'html';
    } else if (ctype.indexOf('css')>-1) {
      ext = 'css';
    } else if (ctype.indexOf('svg')>-1) {
      ext = 'svg';
    } else if (ctype.indexOf('png')>-1) {
      ext = 'png';
    } else if (ctype.indexOf('json')>-1) {
      ext = 'json';
    } else if (ctype.indexOf('script')>-1) {
      ext = 'js';
    }
  }
  return ext;
}