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
