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

function updateUrl(md1, fpath, path, dir) {
  const arr = fpath.replace(`${path}/`, '').split('/')
  const rpl = (s,p) => `${p}https://localhost:3001/${dir}/${arr[0] ? arr[0]+'/' : ''}_assets_/`
  let flag = true
  while (flag) {
    const md2 = md1.replace(regx, rpl)
    if (md1.length !== md2.length) {
      md1 = md2
    } else {
      flag = false
    }
  }
  return md1
}

const regx = /(!\[\w+\]\()(\.)\//
module.exports = ({data: {fpath}}) => {
  let md1 = `${fs.readFileSync(fpath)}`
  const {route, app} = mitm.path
  console.log('>>> help ', fpath)

  if (fpath.match(app)) {
    md1 = updateUrl(md1, fpath, app, 'mitm-app')
  } else if (fpath.match(route)) {
    md1 = updateUrl(md1, fpath, route, 'mitm-assets')
  }

  let content = md.render(md1);
  let flag = true
  while (flag) {
    const arr = content.match(/:att ([^"]+)/)
    if (arr) {
      content = content.replace(`:att ${arr[1]}"`, `" ${arr[1]}`)
    } else {
      flag = false
    }
  }  
  return {content}
}
