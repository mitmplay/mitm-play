console.log('a11y/axe-run!')
window.mitm.fn.axerun = () => {
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
    const {nodes} = violation
    for (const node of nodes) {
      const el = document.querySelector(node.target)
      el.classList.add('axe-run-violation')
    }
  }
}
