window.mitm.fn.axerun = () => { //# a11y
  console.log('a11y/axe-run!')
  window.axe
  .run()
  .then(results => {
    if (results.violations.length) {
      window.mitm.axerun.results = results
      violationHilight()
      console.error('Accessibility issues found')
    }
  })
  .catch(err => {
    window.mitm.axerun.err = err
    console.error('Something bad happened:', err.message)
  })
}

window.mitm.left2buttons = {
  'A11Y-[ctl+alt+Y]|salmon': function axerun() {
    window.mitm.fn.axerun()
  }
}

//mitm.axerun.results.violations[0].nodes[0].target
function violationHilight() {
  let elNode = {}
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
      el.classList.add('axe-run-violation')
      el.classList.add(`axe-grp-${grp}`)
      el._axe_ = {
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

      el.onmouseover = function(e) {
        const node = e.target
        const target = node?._axe_?.target
        if (target && elNode.target!==target) {
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
