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

//mitm.axerun.results.violations[0].nodes[0].target
function violationHilight() {
  const {violations} = mitm.axerun.results
  for (const violation of violations) {
    const {
      description,
      helpUrl,
      impact,
      nodes,
      help,
      tags,
      id, 
    } = violation
    const tgs = tags.join(',')
    for (const node of nodes) {
      const el = document.querySelector(node.target)
      el.classList.add('axe-run-violation')
      el.setAttribute('data-axe-desc'  , description)
      el.setAttribute('data-axe-helper', helpUrl    )
      el.setAttribute('data-axe-impact', impact     )
      el.setAttribute('data-axe-help'  , help       )
      el.setAttribute('data-axe-tags'  , tgs        )
      el.setAttribute('data-axe-grp'   , id         )
    }
  }
}
