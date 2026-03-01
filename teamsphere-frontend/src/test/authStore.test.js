import { describe, it, expect, beforeEach } from 'vitest'
import useAuthStore from '../store/authStore'

const mockUser = { _id: '123', name: 'Jane Admin', email: 'jane@test.com', role: 'admin' }
const mockTenant = { _id: 'tenant-1', name: 'Acme Inc.' }

beforeEach(() => {
  useAuthStore.getState().logout()
})

describe('authStore', () => {
  it('starts unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
  })

  it('sets auth correctly', () => {
    useAuthStore.getState().setAuth({
      user: mockUser,
      accessToken: 'token-abc',
      refreshToken: 'refresh-xyz',
      tenant: mockTenant,
    })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(mockUser)
    expect(state.tenant).toEqual(mockTenant)
    expect(state.accessToken).toBe('token-abc')
  })

  it('logs out and clears state', () => {
    useAuthStore.getState().setAuth({
      user: mockUser,
      accessToken: 'tok',
      refreshToken: 'ref',
      tenant: mockTenant,
    })

    useAuthStore.getState().logout()
    const state = useAuthStore.getState()

    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.tenant).toBeNull()
  })

  it('isAdmin returns true for admin role', () => {
    useAuthStore.getState().setAuth({ user: mockUser, accessToken: 't', refreshToken: 'r', tenant: mockTenant })
    expect(useAuthStore.getState().isAdmin()).toBe(true)
    expect(useAuthStore.getState().isEmployee()).toBe(false)
  })

  it('isManager returns true for manager', () => {
    useAuthStore.getState().setAuth({
      user: { ...mockUser, role: 'manager' },
      accessToken: 't',
      refreshToken: 'r',
      tenant: mockTenant,
    })
    expect(useAuthStore.getState().isManager()).toBe(true)
    expect(useAuthStore.getState().isAdmin()).toBe(false)
  })

  it('hasRole checks multiple roles', () => {
    useAuthStore.getState().setAuth({ user: mockUser, accessToken: 't', refreshToken: 'r', tenant: mockTenant })
    expect(useAuthStore.getState().hasRole(['admin', 'manager'])).toBe(true)
    expect(useAuthStore.getState().hasRole(['employee'])).toBe(false)
  })

  it('updates accessToken', () => {
    useAuthStore.getState().setAuth({ user: mockUser, accessToken: 'old', refreshToken: 'r', tenant: mockTenant })
    useAuthStore.getState().setAccessToken('new-token')
    expect(useAuthStore.getState().accessToken).toBe('new-token')
  })
})
