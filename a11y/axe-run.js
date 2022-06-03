const {fn} = window.mitm 
window.mitm.left2buttons = {
  'a11y---[y---]|lightsalmon'() {fn.axerun()},
  'wcag:aa[yaa-]|lightsalmon'() {fn.axerun(['wcag2a','wcag2aa'])},
  'strict-[yaaa]|lightsalmon'() {fn.axerun(['wcag2a','wcag2aa','wcag2aaa','best-practice'])},
  'clear--[yc--]|lightsalmon'() {clearPopup()},
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
window.mitm.fn.axerun = arr => { //# a11y
  console.log('a11y/axe-run!')
  const {__args} = window.mitm
  const popup = clearPopup()
  const runOpt = {}
  if (Array.isArray(arr)) {
    runOpt.runOnly= arr
  } else if (Array.isArray(__args.a11y)) {
    runOpt.runOnly= __args.a11y
  }
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

//mitm.axerun.results.violations[0].nodes[0].target
function violationHilight(popup) {
  let elNode  = {}
  const {x,y} = document.body.getBoundingClientRect()
  const {violations} = mitm.axerun.results
  for (const violation of violations) {
    const {
      description,
      helpUrl,
      impact,
      nodes,
      help,
      tags,
      id: grp, 
    } = violation
    const tgs = tags.join(', ')
    for (const node of nodes) {
      const {html,target,failureSummary} = node
      const el = document.querySelector(target)
      const dv = document.createElement('div')
      const rc = el.getClientRects()[0]
      popup.appendChild(dv)
      const {top:t, left:l, width:w, height:h} = rc
      const left= -x + l
      const top = -y + t 
      dv._axe_= {
        failureSummary,
        description,
        helpUrl,
        target,
        impact,
        html,
        help,
        tgs,
        grp,
      }

      let style
      if (grp.match(/page-/)) {
        style = `left:0;top:0;width:100vw;height:10px;`
      } else {
        style = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;`
      }
      dv.style  = style
      dv.classList.add('axe-run-violation')
      dv.classList.add(`axe-grp-${grp}`)
      dv.onmouseover = function(e) {
        const node   = e.target
        const target = node?._axe_?.target
        if (target && elNode.target!==target) {
          document.querySelectorAll('.a11y-popup').forEach(n=>n.remove())
          const {mitm: {svelte: {A11yPopup}, fn}} = window
          fn.svelte(A11yPopup, {popup: true, node})
          mitm.axerun.elNode = elNode
          elNode.target = target
          elNode.node   = node
        }
      };
    }
  }
}
