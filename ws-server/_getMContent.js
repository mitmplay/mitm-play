const hj = require('highlight.js');
const md = require('markdown-it')({
  html: true,
  linkify: true,
  highlight: function (code, language) {
    if (language && hj.getLanguage(language)) {
      try {
        return hj.highlight(code, {language, ignoreIllegals: true }).value
      } catch (__) {}
    }
    return ''; // use external default escaping
  }
});
const {fs} = global.mitm.lib

const anchor = require('markdown-it-anchor')
const container = require('markdown-it-container')
md.use(anchor);
md.use(container, 'summary', {

  validate: function(params) {
    return params.trim().match(/^summary\s+(.*)$/);
  },

  render: function (tokens, idx) {
    var m = tokens[idx].info.trim().match(/^summary\s+(.*)$/);

    if (tokens[idx].nesting === 1) {
      // opening tag
      return `<div class="details" title="${md.renderInline(m[1])}">\n`;
    } else {
      // closing tag
      return '</div>\n';
    }
  }
});

function updateUrl(md1, fpath, path, dir) {
  const arr = fpath.replace(`${path}/`, '').split('/')
  const rpl = (s,p) => `${p}https://localhost:3005/${dir}/${arr.length>1 ? arr[0]+'/' : ''}_assets_/`
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

  if (!global.mitm.__flag['ws-message']) {
    console.log('>>> help ', fpath)
  }

  if (fpath.match(app)) {
    md1 = updateUrl(md1, fpath, app, 'mitm-app')
  } else if (fpath.match(route)) {
    md1 = updateUrl(md1, fpath, route, 'mitm-assets')
  }

  function _mermaid(match, p1, p2) {
return `
<div class="details _mermaid_" title="${md.renderInline(p1)}">
<div class="mermaid">
${p2}
</div>
</div>
`
  }
  const rMermaid = /\^\^\^ mermaid +([^\n]+)\n(.+?(?=\^\^\^))\^\^\^/s
  while (md1.match(rMermaid)) {
    md1 = md1.replace(rMermaid, _mermaid)
  }

  function _expand(match, p1, p2) {
    return `
<div class="details _summary_" title="${md.renderInline(p1)}">
${p2}
</div>
`
  }
  const rSummary = /\^\^\^ summary +([^\n]+)\n(.+?(?=\^\^\^))\^\^\^/s
  while (md1.match(rSummary)) {
    md1 = md1.replace(rSummary, _expand)
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
