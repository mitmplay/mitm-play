import { writable } from 'svelte/store'

export const source = writable({
  openDisabled: false,
  saveDisabled: true,
  goDisabled: true,
  content: '',
  fpath: '',
  path: ''
})

export const tabstore = writable({
  editor: {},
  tab: 0
})
