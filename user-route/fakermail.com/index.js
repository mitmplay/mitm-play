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
  tags: [],
  mock: {':clean:google.+.com': ''},
  css:  {':clean:/css/app.css': `=>${css}`},
}
module.exports = route;
