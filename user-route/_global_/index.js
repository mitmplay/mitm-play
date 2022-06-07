const route = {
  a11y: {
    baseUrl: 'https://www.w3.org/WAI/WCAG21/',
    wcag412:{id:'4.1.2',desc:'Non-text Content!',link:'Understanding/non-text-content', tags: ['wcagaa']},
  },
  'args': {
    debug: true
  },
  'flag': {
    'ws-connect': true,
    'ws-message': true,
  }
}
module.exports = route;
