import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AppProvider } from "./hooks/useApp"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { Navbar } from "./components/Navbar"
import { MobileNav } from "./components/MobileNav"
import { PermissionGate } from "./components/PermissionGate"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { RoleGuard } from "./components/RoleGuard"
import { ScannerPage } from "./pages/ScannerPage"
import { LibraryPage } from "./pages/LibraryPage"
import { HistoryPage } from "./pages/HistoryPage"
import { SettingsPage } from "./pages/SettingsPage"
import { LoginPage } from "./pages/LoginPage"
import { SignupPage } from "./pages/SignupPage"
import { PatientsPage } from "./pages/PatientsPage"
import { CabinetPage } from "./pages/CabinetPage"
import { SafetyPage } from "./pages/SafetyPage"
import { PrescriptionScannerPage } from "./pages/PrescriptionScannerPage"
import { StripComparatorPage } from "./pages/StripComparatorPage"
import { CaregiverDashboard } from "./pages/CaregiverDashboard"
import { PatientDashboard } from "./pages/PatientDashboard"
import { usePermissions } from "./hooks/usePermissions"
import "./index.css"

import { useState } from "react"
import { Sidebar } from "./components/Sidebar"

function RootRedirect() {
  const { role, user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={role === 'caregiver' ? "/caregiver/dashboard" : "/patient/dashboard"} replace />
}

function AppInner() {
  const perms = usePermissions()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`app-root ${user ? 'has-sidebar' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {user && (
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      )}
      <PermissionGate perms={perms} />
      <main className={`app-main ${user ? (collapsed ? 'collapsed-margin' : 'expanded-margin') : 'full-width'}`}>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Caregiver Routes */}
          <Route
            path="/caregiver/dashboard"
            element={
              <RoleGuard allowedRoles={['caregiver']}>
                <CaregiverDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/caregiver/patients"
            element={
              <RoleGuard allowedRoles={['caregiver']}>
                <PatientsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/caregiver/medicine-cabinet"
            element={
              <RoleGuard allowedRoles={['caregiver']}>
                <CabinetPage />
              </RoleGuard>
            }
          />
          <Route
            path="/caregiver/medicine-scanner"
            element={
              <RoleGuard allowedRoles={['caregiver']}>
                <ScannerPage />
              </RoleGuard>
            }
          />
          <Route
            path="/caregiver/prescription-scanner"
            element={
              <RoleGuard allowedRoles={['caregiver']}>
                <PrescriptionScannerPage />
              </RoleGuard>
            }
          />
          <Route
            path="/caregiver/compare"
            element={
              <RoleGuard allowedRoles={['caregiver']}>
                <StripComparatorPage />
              </RoleGuard>
            }
          />

          {/* Patient Routes */}
          <Route
            path="/patient/dashboard"
            element={
              <RoleGuard allowedRoles={['patient']}>
                <PatientDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/patient/medicine-cabinet"
            element={
              <RoleGuard allowedRoles={['patient']}>
                <CabinetPage />
              </RoleGuard>
            }
          />
          <Route
            path="/patient/medicine-scanner"
            element={
              <RoleGuard allowedRoles={['patient']}>
                <ScannerPage />
              </RoleGuard>
            }
          />
          <Route
            path="/patient/prescriptions"
            element={
              <RoleGuard allowedRoles={['patient']}>
                <PrescriptionScannerPage />
              </RoleGuard>
            }
          />

          {/* Common Protected / Utility Routes */}
          <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* Legacy Aliases */}
          <Route path="/dashboard" element={<RootRedirect />} />
          <Route path="/cabinet" element={<CabinetPage />} />
          <Route path="/prescriptions" element={<PrescriptionScannerPage />} />
          <Route path="/comparator" element={<StripComparatorPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  )
}
