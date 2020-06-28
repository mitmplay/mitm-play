module.exports = () => {  
  const _global_vars = () => {
    return {body: global.mitm.fn.wsclient()};
  };
  
  const mock = {
    '/mitm-play/websocket.js': {
      response: _global_vars,
    },
  }
  global.mitm.__mock = mock;
  global.mitm.source = {};
  global.mitm.routes = {
    '_global_': {
      mock,
    }
  };
  global.mitm.router = {
    '_global_': {
      _namespace_: /_global_/,
      mock: {
        '/mitm-play/websocket.js': new RegExp('/mitm-play/websocket.js')
      },
    }
  };
};
