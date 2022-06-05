const _criterion = require('./criterion')
//mitm.axerun.results.violations[0].nodes[0].target
function violationHilight(popup) {
  const rect = document.body.getBoundingClientRect()
  const r = mitm.axerun.results
  iterate(r.violations, popup, rect)
  iterate(r.incomplete, popup, rect, true)
}

function iterate(arr, popup, {x,y}, incomplete) {
  let elNode  = {}
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
    const tgs = tags.join(', ')
    for (const node of nodes) {
      const {html,target,all,any} = node
      const el = document.querySelector(target)
      const dv = document.createElement('div')
      const rc = el.getClientRects()[0]
      if (rc===undefined) {
        continue
      }
      popup.appendChild(dv)
      const criterion = _criterion(tags)
      const {top:t, left:l, width:w, height:h} = rc
      const left= -x + l
      const top = -y + t 
      dv._axe_= {
        description,
        incomplete,
        criterion,
        helpUrl,
        impact,
        html,
        all,
        any,
        help,
        tgs,
        grp,
        el,
      }

      let style
      if (grp.match(/page-/)) {
        style = `left:0;top:0;width:100vw;height:10px;`
      } else {
        style = `left:${left}px;top:${top}px;width:10px;height:10px;`
        // style = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;`
      }
      dv.style  = style
      dv.classList.add('axe-run-violation')
      dv.classList.add(`axe-grp-${grp}`)
      
      if (tgs.includes('wcag2aaa')) {
        dv.classList.add(`axe-grp-wcag2aaa`)
      } else if (tgs.includes('best-practice')) {
        dv.classList.add(`axe-grp-best-practice`)
      }
      
      if (incomplete) {
        dv.classList.add(`axe-incomplete`)
      }
      dv.onmouseover = function(e) {
        const node   = e.target
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

module.exports = violationHilight
