const c = require('ansi-colors');

function tldomain(fullpath) {
  let fp;
  if (fullpath.match(/^chrome/)) {
    return fullpath;
  }
  try {
    fp = fullpath.match(/^\w+:\/\/([\w.]+)/);
    if (fp) {
      fp = fp[1].
      split('.').reverse().
      slice(0,3).reverse().
      join('.');    
    } else {
      fp = '**tld-error**';  
      console.log(c.redBright(`>> Error tldomain ${fullpath}`));
    }
  } catch (error) {
    fp = '**tld-error**';
    console.log(c.redBright(`>> Error tldomain ${fullpath}`));
    console.log(error);
  }
  return fp.replace('www.', '');
}

module.exports = tldomain;
