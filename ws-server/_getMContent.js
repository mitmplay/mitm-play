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

module.exports = ({ data }) => {
  const markdown = `${fs.readFileSync(data.fpath)}`
  const content = md.render(markdown);
  return {content}
}
