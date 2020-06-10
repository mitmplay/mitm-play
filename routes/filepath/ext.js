module.exports = (resp) => {
  let ext = '';
  let ctype = resp.headers['content-type'];
  if (ctype) {
    if (Array.isArray(ctype)) {
      ctype = ctype[0];
    }
    if (ctype.indexOf('html')>-1) {
      ext = 'html';
    } else if (ctype.indexOf('css')>-1) {
      ext = 'css';
    } else if (ctype.indexOf('svg')>-1) {
      ext = 'svg';
    } else if (ctype.indexOf('png')>-1) {
      ext = 'png';
    } else if (ctype.indexOf('gif')>-1) {
      ext = 'gif';
    } else if (ctype.indexOf('jpeg')>-1) {
      ext = 'jpeg';
    } else if (ctype.indexOf('json')>-1) {
      ext = 'json';
    } else if (ctype.indexOf('script')>-1
            && ctype.indexOf('json')===-1) {
      ext = 'js';
    } else if (ctype.indexOf('mpegURL')>-1) {
      ext = 'm3u8';
    } else if (ctype.indexOf('plain')>-1) {
      ext = 'txt';
    } else if (ctype.indexOf('html')>-1) {
      ext = 'html';
    } else if (ctype.indexOf('MP2T')>-1) {
      ext = 'ts';
    } else if (ctype.indexOf('webm')>-1) {
      ext = 'webm';
    } else if (ctype.indexOf('mp4')>-1) {
      ext = 'mp4';
    }
}
  return ext;
}
