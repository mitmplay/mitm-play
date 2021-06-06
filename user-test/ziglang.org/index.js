const route = {
  url: 'https://ziglang.org/download/0.8.0/release-notes.html',
  urls: {
    zgs: 'https://ziglang.org/img/zig-logo-light.svg',
    zig: 'https://t.co/zGeOv3vfF6'
  },
  // skip: ['zig-logo-light'],
  html: {
    '/download': {
      ws:true
    }
  },
  log: {
    '/img': {
      contentType: ['image'],
    }
  }
}
module.exports = route
// https://www.keybr.com/assets/85d211e18f78f794.js