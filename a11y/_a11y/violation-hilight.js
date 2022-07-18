const _criterion1 = require('./criterion1')
const _criterion2 = require('./criterion2')
const divPosition = require('./div-position')
let elNode  = {}

//mitm.axerun.results.violations[0].nodes[0].target
function violationHilight(popup) {
  const rect = document.body.getBoundingClientRect()
  const r = mitm.axerun.results
  iterate(r.violations, popup, rect)
  iterate(r.incomplete, popup, rect, true)

  popup.onmouseover = function(e) {
    const node = e.target
    if (node.classList.contains('axe-run-violation') && elNode.node!==node) {
      document.querySelectorAll('.a11y-popup').forEach(n=>n.remove())
      const {mitm: {svelte: {A11yPopup}, fn}} = window
      fn.svelte(A11yPopup, {popup: true, node})
      mitm.axerun.elNode = elNode
      elNode.target = node?._axe_?.target
      elNode.node   = node
    }
  }
}

function iterate(arr, popup, {x,y}, incomplete) {
  for (const violation of arr) {
    const {
      description,
      helpUrl,
      impact,
      nodes,
      help,
      tags,
      id: grp, 
    } = violation
    for (const node of nodes) {
      const {html,target,all,any} = node
      const el = document.querySelector(target)
      const dv = document.createElement('div')
      const rc = el.getClientRects()[0]
      if (rc===undefined) {
        continue
      }
      popup.appendChild(dv)
      const criterion1 = _criterion1(tags)
      const criterion2 = _criterion2(tags)
      const {top:t, left:l, width:w, height:h} = rc
      const left= -x + l
      const top = -y + t 
      dv._axe_= {
        description,
        incomplete,
        criterion1,
        criterion2,
        helpUrl,
        impact,
        target,
        html,
        help,
        tags,
        left,
        top,
        grp,
        all,
        any,
        el,
      }
      divPosition(dv)
    }
  }
}

module.exports = violationHilight
