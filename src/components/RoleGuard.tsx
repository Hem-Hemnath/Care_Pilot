import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../types'
import type { ReactNode } from 'react'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(role)) {
    const fallbackPath = role === 'caregiver' ? '/caregiver/dashboard' : '/patient/dashboard'
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}
