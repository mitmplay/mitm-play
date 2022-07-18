function defaultHotKeys() {
  const {mitm: {svelte: {Cspheader, Sqlite}, argv, fn}} = window
  const qry  = '.mitm-container.popup' 
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

  let keys = {
    'code:KeyP'(_e) {fn.svelte(Cspheader, 'LightPastelGreen')},
    'code:KeyQ'(_e) {fn.svelte(Sqlite   , 'LightPastelGreen')},
  }
  keys['code:KeyP']._title = 'Show CSP Header'
  keys['code:KeyQ']._title = 'Show Sqlite'

  if (argv.a11y && fn.axerun) {
    keys = {
      ...keys,
      'key:yyy'(_e) {fn.axerun(wcag3, rulesObj              )},
      'key:yy' (_e) {fn.axerun(wcag2                        )},
      'key:y'  (_e) {fn.axerun(                             )},
      'key:c'  (_e) {document.querySelector(qry).innerText=''},
    }
    keys['key:yyy']._title = 'Exec. a11y strict'
    keys['key:yy' ]._title = 'Exec. a11y wcag:aa'
    keys['key:y'  ]._title = 'Exec. a11y default'
    keys['key:c'  ]._title = 'Clear a11y result'
  }
  return keys
}

module.exports = defaultHotKeys
