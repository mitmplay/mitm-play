const fs = require('fs-extra');
const logs = require('./fn/logs');

module.exports = () => {    
  const {argv, fn: {nameSpace}} = global.mitm;

  const mock = {
    '/mitm-play/mitm.js': {
      response: resp => {
        return {body: global.mitm.fn.wsmitm(resp)};
      },
    },
    '/mitm-play/macros.js': {
      response: resp => {
        let path;
        const namespace = nameSpace(resp.url);
        if (namespace) {
          path = `${argv.route}/${namespace}/macros.js`;
          if (fs.existsSync(path)) {
            const body = fs.readFileSync(path);
            return {body};  
          }
        }
      },
    },
    '/mitm-play/websocket.js': {
      response: resp => {
        return {body: global.mitm.fn.wsclient()};
      },
    },
    '/mitm-play/chance.js': {
      response: resp => {
        path = `${global.__app}/lib/chance.js`;
        if (fs.existsSync(path)) {
          const body = fs.readFileSync(path);
          return {body};  
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
