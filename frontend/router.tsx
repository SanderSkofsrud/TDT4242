import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { useAuth } from './context/AuthContext'
import { usePrivacy } from './context/PrivacyContext'
import { ROLE_CAPABILITIES, type Capability } from './types/capabilities'
import { LoadingSpinner } from './components/common/LoadingSpinner'

// Placeholder lazy imports for Layer 6 pages.
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const PrivacyNotice = lazy(() => import('./pages/PrivacyNotice'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const InstructorDashboard = lazy(
  () => import('./pages/InstructorDashboard'),
)
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard'))
const AssignmentGuidance = lazy(
  () => import('./pages/AssignmentGuidance'),
)
const GuidanceManagement = lazy(
  () => import('./pages/GuidanceManagement'),
)
const DeclarationSubmit = lazy(
  () => import('./pages/DeclarationSubmit'),
)
const ComplianceFeedback = lazy(
  () => import('./pages/ComplianceFeedback'),
)
const PrivacySettings = lazy(() => import('./pages/PrivacySettings'))
const DataExport = lazy(() => import('./pages/DataExport'))

interface ProtectedRouteProps {
  requiredCapability?: Capability
  children: React.ReactElement
}

function ProtectedRoute({
  requiredCapability,
  children,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const { needsAcknowledgement } = usePrivacy()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (needsAcknowledgement && location.pathname !== '/privacy-notice') {
    return <Navigate to="/privacy-notice" replace />
  }

  if (requiredCapability) {
    const userCapabilities = ROLE_CAPABILITIES[user.role] ?? []
    if (!userCapabilities.includes(requiredCapability)) {
      return (
        <div>
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      )
    }
  }

  return children
}

function PublicOnlyRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuth()
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/privacy-notice"
            element={
              <ProtectedRoute>
                <PrivacyNotice />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredCapability="dashboard:read:own">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/instructor/:courseId"
            element={
              <ProtectedRoute requiredCapability="dashboard:read:course_aggregate">
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/faculty"
            element={
              <ProtectedRoute requiredCapability="dashboard:read:faculty_aggregate">
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments/:assignmentId/guidance"
            element={
              <ProtectedRoute requiredCapability="guidance:read">
                <AssignmentGuidance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments/:assignmentId/guidance/manage"
            element={
              <ProtectedRoute requiredCapability="guidance:write">
                <GuidanceManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/declarations/submit"
            element={
              <ProtectedRoute requiredCapability="declaration:write">
                <DeclarationSubmit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/declarations/:declarationId/feedback"
            element={
              <ProtectedRoute requiredCapability="declaration:read:own">
                <ComplianceFeedback />
              </ProtectedRoute>
            }
          />

          <Route
            path="/privacy"
            element={
              <ProtectedRoute requiredCapability="sharing:manage">
                <PrivacySettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/export"
            element={
              <ProtectedRoute requiredCapability="data:export:own">
                <DataExport />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </Suspense>
  )
}

