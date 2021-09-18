const hello = () => {
  // This is intentional
}

const routes = {
  _global_: {
    mock: {
      // '/mitm-play/ws-client.js': {
      //   resp() {return {}},
      // },
    },
    config: {}
  },
  'google.com': {
    title: 'Search - google',
    url: 'https://google.com/search?q=github+playwright',
    skip: [
      'search',
      'exclude.com'
    ],
    html: {
      'www.gtm.com/search': {
        el: 'body', // JS at end of
        js: [hello] // html body
      }
    }, // all js request from gstatic.com
    js: { 'gstatic.com': '' } // will be empty response
  }
}

module.exports = routes
