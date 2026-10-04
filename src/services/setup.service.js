import { httpService } from './http.service'

const BASE_URL = 'setup/'

export const setupService = {
  getState,
  markStep,
  finish,
  isPending,
  doneCount,
}

async function getState() {
  return httpService.get(BASE_URL)
}

/** Records one finished step without touching the others. */
async function markStep(step) {
  return httpService.put(BASE_URL, { steps: { [step]: true } })
}

/** Ends the flow, whether it was completed or dismissed. */
async function finish() {
  return httpService.put(BASE_URL, { status: 'done' })
}

function isPending(state) {
  return state?.status === 'pending'
}

function doneCount(state) {
  return Object.values(state?.steps || {}).filter(Boolean).length
}
