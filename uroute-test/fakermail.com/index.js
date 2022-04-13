const css = `
h1,nav,span.text-gray-500,.py-12.bg-white,.absolute.inset-0,
.bg-gray-100.border-t.border-gray-200,p.hidden,
.relative.max-w-7xl.mx-auto,.my-12 .mirror {
  display: none !important;
}
.relative.pt-6.pb-3 {
  padding: 0 !important;
}`;
const route = {
  url: 'https://fakermail.com/',
  css:  {':ror !clean css-js:/css/app': `=>${css}`},
  mock: {
    '#201:clean:google.+.com': ''
  },
  'cache:css-js clean': {
    '/js': {
      contentType: ['script'],
      jsonHeader: ['nel'],
      tags: ['js']
    },
    '/css': {
      contentType: ['css'],
      jsonHeader: ['nel'],
      tags: ['css']
    },
    '/domains': {
      contentType: ['json'],
      jsonHeader: ['nel']
    }
  },
}
module.exports = route;
