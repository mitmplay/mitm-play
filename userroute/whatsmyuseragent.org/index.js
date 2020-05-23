const domain =  __dirname.split(/\\|\//).pop();

routes = {
  title: 'Developer - zdnet',
  url: 'https://www.zdnet.com/topic/developer/',
  exclude: ['google'],
  cache: {'.js$': {}},
}
global.mitm.fn.routeSet(routes, domain, true)
