const violationHilight = require('./violation-hilight')
const {getColor, contrast} = require('./contrast')
const {fn}  = window.mitm 
fn.getColor = getColor
fn.contrast = contrast
const wcag2 = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
]
const wcag3 = [
  // ...wcag2,
  'wcag2aaa',
  'wcag21aaa',
  'best-practice',
]
const rulesObj = {
  'color-contrast': { enabled: true },
}

window.mitm.left2buttons = {
  'strict-[yyy]|lightsalmon'() {fn.axerun(wcag3, rulesObj)},
  'wcag:AA[yy-]|lightsalmon'() {fn.axerun(wcag2)},
  'a11y---[y--]|lightsalmon'() {fn.axerun(     )},
  'clear--[c--]|lightsalmon'() {clearAxes(     )},
}

//https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#getting-started
window.mitm.fn.axerun = (values, rules) => { //# a11y
  console.log('a11y/axe-run!')
  const {__args} = window.mitm
  const popup = clearAxes()
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
  // runOpt.exclude = [['.mitm-btn']]
  console.log(runOpt)
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

function clearAxes() {
  const popup = document.querySelector('.mitm-container.popup')
  popup.innerText = ''
  return popup
}
