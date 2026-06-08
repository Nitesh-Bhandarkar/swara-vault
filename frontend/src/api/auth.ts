import client from './client'

export const login = (username: string, password: string) =>
  client.post<{ username: string }>('/auth/login', { username, password })

export const logout = () => client.post('/auth/logout')

export const register = (username: string, email: string, password: string) =>
  client.post('/auth/register', { username, email, password })

export const getMe = () => client.get<{ username: string }>('/auth/me')
