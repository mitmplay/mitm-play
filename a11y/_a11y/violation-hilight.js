const _criterion1 = require('./criterion1')
const _criterion2 = require('./criterion2')
//mitm.axerun.results.violations[0].nodes[0].target
function violationHilight(popup) {
  const rect = document.body.getBoundingClientRect()
  const r = mitm.axerun.results
  iterate(r.violations, popup, rect)
  iterate(r.incomplete, popup, rect, true)
}

let elNode  = {}
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
        html,
        all,
        any,
        help,
        tags,
        grp,
        el,
      }

      let style
      if (grp.match(/page-/)) {
        style = `left:0;top:0;width:100vw;height:10px;`
      } else { // check parent element is fixed so do the box
        style = `left:${left}px;top:${top}px;width:10px;height:10px;`
        let pnode = el.parentElement
        while (pnode && getComputedStyle(pnode).position!=='fixed') {
          pnode = pnode.parentElement
        }
        if (pnode && getComputedStyle(pnode).position==='fixed') {
          style += 'position:fixed;'
        }
      }
      dv.style  = style
      dv.classList.add('axe-run-violation')
      dv.classList.add(`axe-grp-${grp}`)
      
      if (tags.includes('wcag2aaa')) {
        dv.classList.add(`axe-grp-wcag2aaa`)
      } else if (tags.includes('best-practice')) {
        dv.classList.add(`axe-grp-best-practice`)
      }
      
      if (incomplete) {
        dv.classList.add(`axe-incomplete`)
      }
      dv.onmouseover = function(e) {
        const node   = e.target
        if (elNode.node!==node) {
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
