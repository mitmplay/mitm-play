// const headerCSP = function({headers}) {
//   const val = ' blob: ws://localhost:3000 ';
//   const csp = headers['content-security-policy'];
//   if (csp) {
//     headers['content-security-policy'] = csp[0].replace(/ blob: /g, val);
//   }
//   return {headers};
// };

const unregisterJS = function() {
  // document.addEventListener('DOMContentLoaded', (event) => {
    // setTimeout(() => {
      console.log('unregister service worker')
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
        registration.unregister()
      }});
    // }, 1000)
  // })
};

let debunk;
let urlList = [];
function html5vid({url}, fn) {
  if (url.match(/.ts$/)) {
    urlList.push(url.replace(/https:\//, `${mitm.home}/cache`));
    debunk && clearTimeout(debunk);
    debunk = setTimeout(function() {
      clearTimeout(debunk);
      const files = urlList;
      urlList = [];
      const arr = files[0].match(/(\d+)\/(pu\/vid|vid)/);
      if (fs.existsSync(`${arr[1]}.mp4`)) {
        return;
      }
      if (arr && arr[1]) {
        const tsList = [];
        for (let file of files) {
          if (file.match(arr[1])) {
            tsList.push(`file '${file}'`);
          }
        }
        fs.writeFileSync(`${arr[1]}.txt`, tsList.join('\n'));
        execFile('ffmpeg', `-f concat -safe 0 -i ${arr[1]}.txt -c copy ${arr[1]}.ts`.split(' '), () => {
          execFile('ffmpeg', `-i ${arr[1]}.ts -acodec copy -vcodec copy ${arr[1]}.mp4`.split(' '), () => {
            fs.remove(`${arr[1]}.txt`);
            fs.remove(`${arr[1]}.ts`);
            fn && fn();
          });
        });
        //console.log(arr);
      }
    }, 1500)
  }
}

const css = `
[data-testid="placementTracking"] {
  display: none !important;
}`

const route = {
  title: 'Twitter - twitter',
  url: 'https://www.twitter.com/search?q=covid&src=typed_query',
  urls: {
    twhome: 'https://twitter.com/home',
    twlogin: 'https://twitter.com/i/flow/login'
  },
  // screenshot: {
  //   selector: 'button[type=submit],a[role=button]',
  //   at: 'sshot',
  // },
  noskip: [
    '/i/api/2/search/adaptive.json',
    '/i/api/2/timeline/home.json',
    'twitter.com/home',
  ],
  mock: {
    // '/sw.js': '',
    // 'abs.twimg.com/': '',
    // 'mitm-play/twitter.js': {
    //   js: [unregisterJS],
    // },
    '/client_event.json': ''
  },
  cache: {
  //   'abs.twimg.com': {
  //     contentType: ['javascript'],
  //     querystring: true,
  //   },
  //   'video.twimg.com': {
  //     contentType: ['mpegURL', 'MP2T'],
  //     response: html5vid,
  //   },
  // },
  // log: {
  //   'api.twitter.com': {
  //     contentType: ['json']
  //   },
  },
  json: {
    '/i/api/2/search/adaptive.json': {response },
    '/i/api/2/timeline/home.json':   {response },
  },
  html: {
    // 'twimg.com': 0,
    'twitter.com': {
      response(resp) {
        // const {headers} = resp
        // delete headers['content-security-policy'] 
      },
      // el: 'body',
      // js: [unregisterJS],
      // response: headerCSP,
      // src:['twitter.js'],
    },
  },
}
module.exports = route;

// lol.timeline.instructions[0].addEntries.entries[1] - entryId: "promotedTweet-1430926902454325253-d67673d83ef523b"
function response(resp, reqs, match) {
  const tw = JSON.parse(resp.body)
  const {entries} = tw.timeline.instructions[0].addEntries
  const twiiits = []
  for (const obj of entries) {
    if (!obj.entryId.match('promotedTweet')) {
      twiiits.push(obj)
    }
  }
  // tw.globalObjects.users = {}
  tw.timeline.instructions[0].addEntries.entries = twiiits
  resp.body = JSON.stringify(tw)
}
