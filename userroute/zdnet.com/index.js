const domain =  __dirname.split(/\\|\//).pop();

const css = `
.col-8.module.featuredStories,
[data-component="medusaAsync"],
[data-component="taboola"],
.shortcode.video.large,
.dynamic-showcase-top,
.article.item.promo,
.taboola-right-rail,
.featured-carousel,
.related-topics,
.item.promo,
.QSIPopOver {
  display: none !important;
}
.module.mostPopular {
  margin-top: 0 !important;
}`;

routes = {
  title: 'Developer - zdnet',
  url: 'https://www.zdnet.com/topic/developer/',
  html: {
    // relax CSP rules
    'zdnet.com': {resp: mitm.fn.unstrictCSP}
  },  
  skip: [
    // skip error `request back` to browser to handle it
    'ad.doubleclick.net/ddm/ad/',
  ],
  js: {
    // remove advertising
    'lightboxcdn.com': '',
    'doubleclick.net': '',
    'everestjs.net': '',
    'demdex.net': '',
    'google.com': '',
  },
  css: {
    // remove partner content
    'cbsistatic.com': `=>${css}`
  },
}
global.mitm.fn.routeSet(routes, domain, true)
