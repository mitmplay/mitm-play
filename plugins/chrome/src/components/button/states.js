import { writable } from 'svelte/store'

export const states = writable({
  state2: {
    collapse: true,
    expand: false
  },
  state3: {
    collapse: true,
    expand: false
  },
})
