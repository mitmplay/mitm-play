const hello = () => {};

const routes = {
  _global_: {
    mock: {
      // '/mitm-play/websocket.js': {
      //   resp() {return {}},
      // },
    },
    config: {},
  },
  'google.com': {
    title: 'Search - google',
    url: 'https://google.com/search?q=github+playwright',
    skip: [
    ],
    skip: [
      'search',
      'exclude.com',
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
