const c = require('ansi-colors');
const rgxDomain = /^\w+:\/\/([\w-.]+)/;

function tldomain(fullpath) {
  if (typeof(fullpath)!=='string' || fullpath.match(/^chrome/)) {
    return fullpath;
  }
  const match = fullpath.match(rgxDomain);
  if (match) {
    return match[1];
  } else {
    console.log(c.redBright(`>> Error tldomain ${fullpath}`));
    return '**tld-error**';
  }
}

module.exports = tldomain;
