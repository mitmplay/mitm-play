function divPosition(dv) {
  const {el, grp, top, left, tags, incomplete} = dv._axe_
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
  dv.style = style
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
}

module.exports = divPosition
