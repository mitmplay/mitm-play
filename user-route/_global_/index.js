const route = {
  a11y: {
    baseUrl: 'https://www.w3.org/WAI/WCAG21/',
    wcag141:{id:'1.4.1',desc:'Use of Color'       ,link:'Understanding/use-of-color'      },
    wcag143:{id:'1.4.3',desc:'Contrast (Minimum)' ,link:'Understanding/contrast-minimum'  },
    wcag146:{id:'1.4.6',desc:'Contrast (Enhanced)',link:'Understanding/contrast-enhanced' },
    wcag412:{id:'4.1.2',desc:'Non-text Content!'  ,link:'Understanding/non-text-content', tags: ['wcagaa']},
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
