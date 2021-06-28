import { writable } from 'svelte/store'

export const states = writable({
  chevron: '[>>]',
  state1: {},
  state2: {},
  state3: {},
  logs: {}
})
