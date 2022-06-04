const violationHilight = require('./violation-hilight')
const {getColor, contrast} = require('./contrast')
const {fn}  = window.mitm 
fn.getColor = getColor
fn.contrast = contrast
const wcag2 = [
  'wcag2a',
  'wcag21a',
  'wcag2aa',
  'wcag21aa',
]
const wcag3 = [
  ...wcag2,
  'wcag2aaa',
  'wcag21aaa',
  'best-practice',
]
const rulesObj = {
  'color-contrast': { enabled: true },
}

window.mitm.left2buttons = {
  'a11y---[y---]|lightsalmon'() {fn.axerun(     )},
  'wcag:aa[yaa-]|lightsalmon'() {fn.axerun(wcag2)},
  'strict-[yaaa]|lightsalmon'() {fn.axerun(wcag3, rulesObj)},
  'clear--[yc--]|lightsalmon'() {clearPopup(    )},
  // 'cat.aria                   |salmon'(){fn.axerun(['cat.aria'                   ])},
  // 'cat.color                  |salmon'(){fn.axerun(['cat.color'                  ])},
  // 'cat.forms                  |salmon'(){fn.axerun(['cat.forms'                  ])},
  // 'cat.keyboard               |salmon'(){fn.axerun(['cat.keyboard'               ])},
  // 'cat.language               |salmon'(){fn.axerun(['cat.language'               ])},
  // 'cat.name-role-value        |salmon'(){fn.axerun(['cat.name-role-value'        ])},
  // 'cat.parsing                |salmon'(){fn.axerun(['cat.parsing'                ])},
  // 'cat.semantics              |salmon'(){fn.axerun(['cat.semantics'              ])},
  // 'cat.sensory-and-visual-cues|salmon'(){fn.axerun(['cat.sensory-and-visual-cues'])},
  // 'cat.structure              |salmon'(){fn.axerun(['cat.structure'              ])},
  // 'cat.tables                 |salmon'(){fn.axerun(['cat.tables'                 ])},
  // 'cat.text-alternatives      |salmon'(){fn.axerun(['cat.text-alternatives'      ])},
  // 'cat.time-and-media         |salmon'(){fn.axerun(['cat.time-and-media'         ])},
}

//https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#getting-started
window.mitm.fn.axerun = (values, rules) => { //# a11y
  console.log('a11y/axe-run!')
  const {__args} = window.mitm
  const popup = clearPopup()
  const type  = 'tag'
  const runOpt= {}
  if (Array.isArray(values)) {
    runOpt.runOnly= {type,values}
  } else if (Array.isArray(__args.a11y)) {
    runOpt.runOnly= {type,values:__args.a11y}
  }
  if (rules) {
    runOpt.rules = rules
  }
  runOpt.exclude = [['.mitm-btn']]
  window.axe
  .run(runOpt)
  .then(results => {
    if (results.violations.length) {
      window.mitm.axerun.results = results
      violationHilight(popup)
      console.error('Accessibility issues found')
    }
  })
  .catch(err => {
    window.mitm.axerun.err = err
    console.error('Something bad happened:', err.message)
  })
}

function clearPopup() {
  const popup = document.querySelector('.mitm-container.popup')
  popup.innerText = ''
  return popup
}
