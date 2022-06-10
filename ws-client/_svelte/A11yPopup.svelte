<script>
  export let node;
  const rect = node.getBoundingClientRect()
  const {x,y}= document.body.getBoundingClientRect()
  const {top:t, left:l, height:h} = rect
  let top  = -y + t + h + 3
  let left = -x + l - 5
  let {
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
    tgs,
    grp,
    el,
  } = node._axe_

  function reformat(arr) {
    const rgx = /([\d.#:]+)( |\w+)/g
    return arr.map(item=>{
      let x1 = item.message
      const x2 = x1.match(rgx)
      x1 = x1.replace(/</g,'&lt;').replace(/>/g,'&gt;')
      x2 && x2.filter(x=>x.length>2).forEach(element => {
        x1 = x1.replace(element, `<b>${element}</b>`)
      })
      return x1
    })
  }
  all = reformat(all)
  any = reformat(any)

  let style
  if (grp.match(/page-/)) {
    style = `top:${top}px;left:0;right:0;margin:auto;`
  } else {
    style = `top:0;left:0;opacity:0;`
  }

  setTimeout(()=> {
    const popup = document.querySelector('.a11y-popup')
    const {
      width:popWidth,
      height:popHeight
    } = popup.getBoundingClientRect()

    const winHeight = window.innerHeight
    const winYOffst = window.pageYOffset
    if (top+popHeight>winHeight-winYOffst) {
      top -= (popHeight + 30)
    }

    const winWidth = document.body.getBoundingClientRect().width
    const winXOffst= window.pageXOffset
    if (left+popWidth>winWidth-winXOffst) {
      left -= (popWidth - 18) 
    }
    if (node.style.position==='fixed') {
      // if box in fixed position, popup too(and update top position)
      popup.style = `top:${top-winYOffst}px;left:${left}px;position:fixed;`
    } else {
      if (grp.match(/page-/)) {
        popup.style = `top:${top}px;left:0;right:0;margin:auto;`
      } else {
        popup.style = `top:${top}px;left:${left}px;`
      }
    }
  })

  function ratio() {
    const {
      contrastRatio,
      expectedContrastRatio,
    } = node._axe_.any[0].data
    if (contrastRatio) {
      return `
      , contrast ratio: ${contrastRatio},
      expected: ${expectedContrastRatio}.`
    } else {
      const {getColor, contrast} = window.mitm.fn
      const ratio = contrast(...getColor(el))
      return `. Contrast ratio: ${ratio}.`
    }
  }

  setTimeout(() => {
    hljs.highlightAll()
  }, 0);

  function copyto(e) {
    const el = document.querySelector('.icopied')
    const text = document.querySelector('.a11y-content').innerHTML
    setTimeout(()=>{el.style = ''}, 3000)
    navigator.clipboard.writeText(text)
    el.style = 'display:block;'
  }
</script>

<div class="a11y-popup" {style}>
  <span class="icopy" on:click={copyto}>
    <svg width="16px" height="16px" viewBox="0 0 16 16" version="1.1">
      <g id="surface1">
      <path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 10.882812 4.027344 L 10.882812 0 L 1.730469 0 L 1.730469 12.269531 L 5.117188 12.269531 L 5.117188 16 L 14.269531 16 L 14.269531 7.417969 Z M 10.882812 5.464844 L 12.535156 7.117188 L 10.882812 7.117188 Z M 2.746094 11.253906 L 2.746094 1.015625 L 9.863281 1.015625 L 9.863281 3.730469 L 5.117188 3.730469 L 5.117188 11.253906 Z M 6.136719 14.984375 L 6.136719 4.746094 L 9.863281 4.746094 L 9.863281 8.136719 L 13.253906 8.136719 L 13.253906 14.984375 Z M 6.136719 14.984375 "/>
      </g>
    </svg>
    <span class="icopied">Copied to clipboard</span>
  </span>
  <div class="a11y-content">
    <h4>{help}</h4>
    <p>{description}</p>
    <p class=tgs><b>tags:</b> {tgs}</p>
    <p>
      <b>criteria:</b>
      {#if criterion1}
        <a target="_blank" rel="noopener noreferrer" href="{criterion1.link}">{criterion1.name}</a>, 
      {/if}
      {#each Object.entries(criterion2) as [key, value]}
        <a target="_blank" rel="noopener noreferrer" href="{value.link}">{value.name}</a>, 
      {/each}
      <a target="_blank" rel="noopener noreferrer" href="{helpUrl}">{grp}</a>
    </p>
    <details open>
      <summary><b>impact:</b> {impact}</summary>
      {#if all.length||any.length}
        <hr/>
        <div class=pre>
          {#if all.length>1}
            <b>Fix ALL of the following:</b>
            <ol>
            {#each all as cat}
              <li>{@html cat}</li>
            {/each}
            </ol>
          {:else if all.length===1}
            {@html all[0]}
          {:else if any.length>1}
            <b>Fix ONE of the following:</b>
            <ol>
            {#each any as cat}
              <li>{@html cat}</li>
            {/each}
            </ol>
          {:else if any.length===1}
            {@html any[0]}
          {/if}
          {#if incomplete && grp==='color-contrast'}
            {ratio()}
          {/if}
        </div>
        <hr/>
      {/if}
      <div class=pre>
        <pre><code class="language-html">{html}</code></pre>
      </div>
    </details>
  </div>
</div>

<style>
.a11y-popup {
  background-color: rgba(255, 228, 196, 0.65);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  position: absolute;
  margin-top: 2px;
  padding: 0 10px;
  height: auto;
  width: 360px;
  box-shadow: 
    rgb(0 0 0 / 25%) 0px  54px 55px, 
    rgb(0 0 0 / 12%) 0px -12px 30px, 
    rgb(0 0 0 / 12%) 0px   4px  6px, 
    rgb(0 0 0 / 17%) 0px  12px 13px, 
    rgb(0 0 0 /  9%) 0px  -3px  5px;
}
.icopy {
  position: absolute;
  cursor: pointer;
  right: 10px;
  top: 10px;
}
.icopied {
  animation: blinker 1s linear infinite;
  font-style: italic;
  position: fixed;
  font-size: 11px;
  color: brown;
  display: none;
  right: 30px;
  top: 23px;
}
@keyframes blinker {
  50% {opacity: 0;}
}
h4 {
  margin: 10px 0;
  font-size: 12px;
  font-weight: 700;
}
p {
  margin: 0.2rem 0;
  font-size: 12px;
}
details {
  margin-bottom: 8px;
}
details summary {
  cursor: pointer;
}
.tgs {
  font-family: serif;
  text-align: inherit;
}
.pre {
  font-size: 11.5px;
}
.pre ol {
  margin: 0;
  padding-inline-start: 15px;
}
pre {
  font-family: ui-monospace, monospace;
  white-space: break-spaces;
  font-size: 11px;
  margin: 0;
}
pre code {
  padding: 5px;
}
</style>
