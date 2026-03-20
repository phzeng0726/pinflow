import axios from 'axios'

const isElectron = typeof window !== 'undefined' && 'electronAPI' in window
const baseURL = isElectron ? 'http://localhost:34115/api/v1' : '/api/v1'

export const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})
