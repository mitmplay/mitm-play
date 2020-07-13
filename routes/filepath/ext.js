const types = {
  MP2T: 'ts',
  webm: 'webm',
  html: 'html',
  json: 'json',
  jpeg: 'jpeg',
  webp: 'webp',
  gif: 'gif',
  png: 'png',
  svg: 'svg',
  mp4: 'mp4',
  xml: 'xml',
  css: 'css',
  plain: 'txt',
  mpegURL: 'm3u8'
}

module.exports = (resp) => {
  let ext = '';
  let ctype = resp.headers['content-type'];
  if (ctype) {
    if (Array.isArray(ctype)) {
      ctype = ctype[0];
    }
    if (ctype.indexOf('script')>-1 && ctype.indexOf('json')===-1) { 
      return 'js';   
    } else {
      for (let key in types) {
        if (ctype.indexOf(key)>-1) {
          return types[key];
        }
      }
    }
  }
  return ext;
}
