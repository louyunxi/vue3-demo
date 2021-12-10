import Cookies from 'js-cookie';

const TokenKey = 'accessToken'

export function getToken() {
  return Cookies.get(TokenKey)
}
export function getTokenKey() {
  return TokenKey
}

export function setToken(token: any) {
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  Cookies.remove(TokenKey)
}
