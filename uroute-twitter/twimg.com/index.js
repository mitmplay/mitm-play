//https://abs.twimg.com/responsive-web/client-serviceworker/serviceworker.2adb84d5.js
//https://abs.twimg.com/responsive-web/client-web/main.50acb6f5.js
const route = {
  title: 'Twitter - Images',
  url: 'https://abs.twimg.com',
  mock: {
    '/client-serviceworker': '',
  },
  response: {
    '/client_event.json': {
      response(resp) {
        const {headers} = resp
        headers['access-control-allow-origin'] = '*'
        console.log('Service Worker!!!')
      },
      tags: 'all-response',
    }
  }
}
module.exports = route;
