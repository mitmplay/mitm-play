import { writable } from 'svelte/store'

export const states = writable({
  chevron: '[>>]',
  state2: false,
  state3: false,
})
