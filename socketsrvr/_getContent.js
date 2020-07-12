const fs = require('fs-extra');
const hjs = require("highlight.js/lib/core");
const xml = require('highlight.js/lib/languages/xml');
const js = require('highlight.js/lib/languages/javascript');
hjs.registerLanguage('javascript', js);
hjs.registerLanguage('xml', xml);
 
const regx = /hljs-string(">)&#x27;([\w-]+)&#x27;/g;
const repl = (m,p1,p2) => `hljs-built_in${p1}${p2}`;

function gutter(code) {
  code = code.replace(regx, repl);
  return code.split('\n').map((n,i) => {
    const id = ((i+1)+'').padStart(4,' ');
    return `${id} ${n}`;
  }).join('\n');
}

module.exports = ({data}) =>{ 
  const {fpath} = data;
  let txt = `${fs.readFileSync(fpath)}`;
  console.log('content', txt);
  if (fpath.match('.html')) {
    txt = hjs.highlight('html', txt).value;
  } else {
    txt = txt.replace(/   "(.+)"(:)/g, (m,p1,p2) =>  `   '${p1}':`).
              replace(  / "(.+)"(:)/g, (m,p1,p2) =>  ` ${p1}:`);
    txt = hjs.highlight('javascript', txt).value;
  }
  return gutter(txt);
};
