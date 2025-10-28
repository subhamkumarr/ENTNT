import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('talentflow_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const signup = async (email, password, name) => {
    // Mock signup
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || !password || !name) {
          reject(new Error('All fields are required'))
          return
        }

        // Check if user already exists (in localStorage)
        const existingUsers = JSON.parse(localStorage.getItem('talentflow_users') || '[]')
        const exists = existingUsers.find(u => u.email === email)
        
        if (exists) {
          reject(new Error('Email already registered'))
          return
        }

        const user = {
          id: Date.now().toString(),
          email,
          role: 'candidate',
          name,
          password: btoa(password) // Simple encoding, not secure
        }

        // Save to users list
        existingUsers.push(user)
        localStorage.setItem('talentflow_users', JSON.stringify(existingUsers))

        // Auto login after signup
        const sessionUser = { id: user.id, email: user.email, role: user.role, name: user.name }
        setUser(sessionUser)
        localStorage.setItem('talentflow_user', JSON.stringify(sessionUser))
        resolve(sessionUser)
      }, 300)
    })
  }

  const login = async (email, password) => {
    // Mock authentication
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check admin first
        if (email === 'admin@gmail.com' && password === 'admin#123') {
          const user = {
            id: '1',
            email: 'admin@gmail.com',
            role: 'admin',
            name: 'Admin User'
          }
          setUser(user)
          localStorage.setItem('talentflow_user', JSON.stringify(user))
          resolve(user)
          return
        }

        // Check registered users
        const existingUsers = JSON.parse(localStorage.getItem('talentflow_users') || '[]')
        const user = existingUsers.find(u => 
          u.email === email && u.password === btoa(password)
        )

        if (user) {
          const sessionUser = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
          }
          setUser(sessionUser)
          localStorage.setItem('talentflow_user', JSON.stringify(sessionUser))
          resolve(sessionUser)
        } else {
          reject(new Error('Invalid email or password'))
        }
      }, 300)
    })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('talentflow_user')
  }

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isCandidate: user?.role === 'candidate' || (user && user?.role !== 'admin')
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
