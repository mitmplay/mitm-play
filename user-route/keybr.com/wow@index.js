const route = {
  cache: {
    '!:/assets/(.+).css': {
      contentType: ['css', 'image'],
      path: '_assets_/',
      file: '    :1.css ',
      // tags: '3.caching',
      // debug: true
    }
  },
  'html:wow': {
    'GET:dodol:/': {
      tags: 'in-html',
      widi: ''
    },
  }  
}
module.exports = route;