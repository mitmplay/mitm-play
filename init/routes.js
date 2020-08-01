const fs = require('fs-extra');
const logs = require('./fn/logs');

module.exports = () => {    
  const {argv, fn: {nameSpace}} = global.mitm;

  const mock = {
    '/mitm-play/mitm.js': {
      response: resp => {
        resp.body = global.mitm.fn.wsmitm(resp);
        resp.headers['content-type'] = 'application/javascript';
      },
    },
    '/mitm-play/macros.js': {
      response: resp => {
        let path;
        const namespace = nameSpace(resp.url);
        if (namespace) {
          path = `${argv.route}/${namespace}/macros.js`;
          if (fs.existsSync(path)) {
            resp.body = fs.readFileSync(path);
            resp.headers['content-type'] = 'application/javascript';
          }
        }
      },
    },
    '/mitm-play/websocket.js': {
      response: resp => {
        resp.body = global.mitm.fn.wsclient();
        resp.headers['content-type'] = 'application/javascript';
      },
    },
    '/mitm-play/jslib/(\\w+).js': {
      response: (resp, match) => {
        path = `${global.__app}/plugins/js-lib/${match.arr[1]}.js`;
        if (fs.existsSync(path)) {
          resp.body = fs.readFileSync(path);
          resp.headers['content-type'] = 'application/javascript';
        }
      }
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
        '/mitm-play/mitm.js': new RegExp('\\/mitm-play\\/mitm\\.js'),
        '/mitm-play/chance.js': new RegExp('\\/mitm-play\\/chance\\.js'),
        '/mitm-play/macros.js': new RegExp('\\/mitm-play\\/macros\\.js'),
        '/mitm-play/websocket.js': new RegExp('\\/mitm-play\\/websocket\\.js'),
      },
    }
  };
};
