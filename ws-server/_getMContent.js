const fs = require('fs-extra')
const hj = require('highlight.js');
const md = require('markdown-it')({
  html: true,
  linkify: true,
  highlight: function (str, lang) {
    if (lang && hj.getLanguage(lang)) {
      try {
        return hj.highlight(lang, str).value;
      } catch (__) {}
    }
 
    return ''; // use external default escaping
  }
});
md.use(require('markdown-it-anchor'));
md.use(require('markdown-it-container'), 'spoiler', {

  validate: function(params) {
    return params.trim().match(/^spoiler\s+(.*)$/);
  },

  render: function (tokens, idx) {
    var m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);

    if (tokens[idx].nesting === 1) {
      // opening tag
      return '<details><summary>' + md.utils.escapeHtml(m[1]) + '</summary>\n';

    } else {
      // closing tag
      return '</details>\n';
    }
  }
});
const regx = /(!\[\w+\]\()(\.)\//
module.exports = ({data: {fpath}}) => {
  const {route} = mitm.path
  console.log('markdown', fpath)
  let md1 = `${fs.readFileSync(fpath)}`
  if (fpath.match(route)) {
    const arr = fpath.replace(`${route}/`, '').split('/')
    const rpl = (s,p) => `${p}https://localhost:301/${arr[0] ? arr[0]+'/' : ''}_image_/`
    let flag = true
    while (flag) {
      const md2 = md1.replace(regx, rpl)
      if (md1.length !== md2.length) {
        md1 = md2
      } else {
        flag = false
      }
    }  
  }
  const content = md.render(md1);
  return {content}
}
