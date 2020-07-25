const fs = require('fs-extra');
const logs = require('./fn/logs');

module.exports = () => {    
  const mock = {
    '/mitm-play/websocket.js': {
      response: resp => {
        return {body: global.mitm.fn.wsclient(resp)};
      },
    },
    '/mitm-play/macros.js': {
      response: resp => {
        const {
          argv: {route: r}, 
          fn: {nameSpace},
        } = global.mitm;
        let path;

        const namespace = nameSpace(resp.url);
        if (namespace) {
          path = `${r}/${namespace}/macros.js`;
          if (fs.existsSync(path)) {
            const body = fs.readFileSync(path);
            return {body};  
          }
        }
      },
    },
  }

  global.mitm.__mock = mock;
  global.mitm.source = {};
  global.mitm.routes = {
    '_global_': {
      mock,
      config: {
        logs: logs()
      }
    }
  };

  global.mitm.router = {
    '_global_': {
      _namespace_: /_global_/,
      mock: {
        '/mitm-play/websocket.js': new RegExp('\\/mitm-play\\/websocket\\.js'),
        '/mitm-play/macros.js': new RegExp('\\/mitm-play\\/macros\\.js'),
      },
    }
  };
};
