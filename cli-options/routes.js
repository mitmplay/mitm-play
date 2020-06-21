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
    default: {mock}
  };
};
