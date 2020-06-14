const c = require('ansi-colors');

function tldomain(fullpath) {
  if (typeof(fullpath)!=='string' || fullpath.match(/^chrome/)) {
    return fullpath;
  }
  let result;
  let match = fullpath.match(/^\w+:\/\/([\w-.]+)/);
  if (match) {
    const arr = match[1].split('.');
    const len = arr.length - 3;
    result = arr.slice(len < 0 ? 0 : len).join('.');   
  } else {
    result = '**tld-error**';
    console.log(c.redBright(`>> Error tldomain ${fullpath}`));
  }
  result = result.replace('www.', '');
  // console.log(`~${result}~`, match[1]);
  return result;
}

module.exports = tldomain;
