const hello = () => {};

const routes = {
  'default': {
    _regex_: /default/,
    mock: {
      // '/mitm-play/websocket.js': {
      //   resp() {return {}},
      // },
    }
  },
  'google.com': {
    title: 'Search - google',
    url: 'https://google.com/search?q=github+playwright',
    exclude: [
      'exclude.com'
    ],
    skip: [
      'search'
    ],
    html: {
      'www.gtm.com/search': {
        el: 'e_end', //JS at end of 
        js: [hello], //html body
      },
    }, //all js request from gstatic.com 
    js: {'gstatic.com': ''} // will be empty response
  }  
}

module.exports = routes;
