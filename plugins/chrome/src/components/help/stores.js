// feat: markdown
import { writable } from 'svelte/store'

export const source = writable({
  openDisabled: false,
  saveDisabled: true,
  goDisabled: true,
  content: 'Hi!',
  fpath: '',
  path: ''
})
