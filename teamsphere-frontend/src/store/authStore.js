import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenant: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken, refreshToken, tenant }) => {
        set({
          user,
          accessToken,
          refreshToken,
          tenant,
          isAuthenticated: true,
        })
      },

      setAccessToken: (accessToken) => set({ accessToken }),

      updateUser: (user) => set({ user }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tenant: null,
          isAuthenticated: false,
        }),

      // Helpers
      isAdmin: () => get().user?.role === 'admin',
      isManager: () => get().user?.role === 'manager',
      isEmployee: () => get().user?.role === 'employee',
      hasRole: (roles) => roles.includes(get().user?.role),
    }),
    {
      name: 'teamsphere-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
