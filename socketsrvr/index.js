const WebSocket = require('ws');
const initSocket = require('./init-socket');
const wsclients = {};

module.exports = () => {
  initSocket()  
}
//https://github.com/websockets/ws
