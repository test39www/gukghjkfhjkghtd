import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { Account } from "../types"
import * as storage from "../storage"

interface AuthState {
  user: Account | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    storage
      .getSession()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setUser(await storage.login(username, password))
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    setUser(await storage.register(username, password))
  }, [])

  const logout = useCallback(async () => {
    await storage.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={ { user, loading, login, register, logout } }>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth должен использоваться внутри AuthProvider")
  return ctx
}
