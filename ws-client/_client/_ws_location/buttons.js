module.exports = bgroup => {
	function createButton(buttons, pos) {
		for (const id in buttons) {
			const [caption, color, klas] = id.split('|').map(x=>x.trim())
			const btn = document.createElement('button')
			const fn  = buttons[id]
			btn.onclick = async e => {
				let arr = fn(e)
				if (arr instanceof Promise) {
					arr = await arr
				}
				if (Array.isArray(arr)) {
					await play(arr)
				}
			}
			btn.innerText = caption
			btn.classList.add('mitm-btn')
			btn.classList.add(`${pos}`)
			btn.classList.add(klas || caption)
			btn.style = color ? `background: ${color};` : ''
			if (pos==='topr') {
				const br = document.createElement('span')
				br.innerHTML = '&nbsp;'
				bgroup[pos].appendChild(br)
				bgroup[pos].appendChild(btn)
			} else {
				const div = document.createElement('div')
				div.appendChild(btn)
				bgroup[pos].appendChild(div)
			}
		}
	}
	
	function setButtons (buttons, position) {
		if (bgroup[position]) {
			bgroup[position].innerHTML = ''
			createButton(buttons, position)
		}
	}

	return setButtons	
}
