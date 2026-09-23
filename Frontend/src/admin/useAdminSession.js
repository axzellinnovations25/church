import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../lib/auth'
import { clearAdminCache } from '../lib/admin'

export function useAdminSession() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function refreshUser() {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      clearAdminCache()
      navigate('/login', { replace: true })
      return null
    }

    setUser(currentUser)
    return currentUser
  }

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()

        if (!isMounted) {
          return
        }

        if (!currentUser) {
          clearAdminCache()
          navigate('/login', { replace: true })
          return
        }

        setUser(currentUser)
      } catch {
        if (isMounted) {
          clearAdminCache()
          navigate('/login', { replace: true })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [navigate])

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
    } finally {
      clearAdminCache()
      navigate('/login', { replace: true })
    }
  }

  return {
    user,
    isLoading,
    isLoggingOut,
    refreshUser,
    handleLogout,
  }
}
