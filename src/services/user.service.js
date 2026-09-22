import { httpService } from './http.service'

export const userService = {
  login,
  signup,
  logout,
  getUsers,
  getLoggedInUser,
  getEmptyCredentials,
  getInviteCode,
  regenerateInviteCode,
}

const BASE_URL = 'auth/'
const STORAGE_KEY = 'loggedinUser'

async function login({ username, password }) {
  const user = await httpService.post(BASE_URL + 'login', {
    username,
    password,
  })
  _setLoggedInUser(user)
  return user
}

async function signup(credentials) {
  const user = await httpService.post(BASE_URL + 'signup', credentials)
  _setLoggedInUser(user)
  return user
}

async function logout() {
  await httpService.post(BASE_URL + 'logout')
  sessionStorage.removeItem(STORAGE_KEY)
}

async function getUsers() {
  return await httpService.get('user')
}

async function getInviteCode() {
  const res = await httpService.get(BASE_URL + 'invite-code')
  return res.inviteCode
}

async function regenerateInviteCode() {
  const res = await httpService.post(BASE_URL + 'invite-code/regenerate')
  return res.inviteCode
}

function getLoggedInUser() {
  try {
    const entity = sessionStorage.getItem(STORAGE_KEY)
    return entity ? JSON.parse(entity) : null
  } catch {
    return null
  }
}

function getEmptyCredentials() {
  return {
    username: '',
    password: '',
    fullname: '',
  }
}

function _setLoggedInUser(user) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}
