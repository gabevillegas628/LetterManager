import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api } from '../api/client'
import type { Professor } from 'shared'

interface AuthContextType {
  professor: Professor | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<Professor>) => Promise<void>
  uploadLetterhead: (file: File) => Promise<void>
  deleteLetterhead: () => Promise<void>
  uploadSignature: (file: File) => Promise<void>
  deleteSignature: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [professor, setProfessor] = useState<Professor | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await api.get('/auth/me')
      setProfessor(response.data.data)
    } catch {
      localStorage.removeItem('token')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { token, professor: prof } = response.data.data
    localStorage.setItem('token', token)
    setProfessor(prof)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setProfessor(null)
  }

  const updateProfile = async (data: Partial<Professor>) => {
    const response = await api.put('/auth/profile', data)
    setProfessor(response.data.data)
  }

  const uploadLetterhead = async (file: File) => {
    const formData = new FormData()
    formData.append('letterhead', file)
    const response = await api.post('/auth/letterhead', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    setProfessor(response.data.data)
  }

  const deleteLetterhead = async () => {
    const response = await api.delete('/auth/letterhead')
    setProfessor(response.data.data)
  }

  const uploadSignature = async (file: File) => {
    const formData = new FormData()
    formData.append('signature', file)
    const response = await api.post('/auth/signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    setProfessor(response.data.data)
  }

  const deleteSignature = async () => {
    const response = await api.delete('/auth/signature')
    setProfessor(response.data.data)
  }

  return (
    <AuthContext.Provider
      value={{
        professor,
        isAuthenticated: !!professor,
        isLoading,
        login,
        logout,
        updateProfile,
        uploadLetterhead,
        deleteLetterhead,
        uploadSignature,
        deleteSignature,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
