import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from './context/AuthContext'
import { usePrivacy } from './context/PrivacyContext'
import { ROLE_CAPABILITIES, type Capability } from './types/capabilities'
import { LoadingSpinner } from './components/common/LoadingSpinner'
import { NavBar } from './components/common/NavBar'

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/dashboard'

  return (
    <>
      <NavBar />
      {!isHome && (
        <div className="container-app pt-3 pb-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary py-2 px-4 text-sm"
          >
            Back
          </button>
        </div>
      )}
      {children}
    </>
  )
}

// Placeholder lazy imports for Layer 6 pages.
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const PrivacyNotice = lazy(() => import('./pages/PrivacyNotice'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const InstructorDashboardHome = lazy(
  () => import('./pages/InstructorDashboardHome'),
)
const InstructorDashboard = lazy(
  () => import('./pages/InstructorDashboard'),
)
const InstructorAssignments = lazy(
  () => import('./pages/InstructorAssignments'),
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
const Profile = lazy(() => import('./pages/Profile'))

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
        <AuthenticatedLayout>
          <div className="container-app py-16 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You do not have permission to view this page.</p>
          </div>
        </AuthenticatedLayout>
      )
    }
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

function PublicOnlyRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuth()
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function DashboardByRole() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'student') {
    return <StudentDashboard />
  }
  if (user.role === 'instructor') {
    return <InstructorDashboardHome />
  }
  if (user.role === 'head_of_faculty') {
    // Redirect head of faculty to the faculty dashboard route with the demo faculty ID.
    return (
      <Navigate
        to="/dashboard/faculty?facultyId=11111111-1111-1111-1111-111111111111"
        replace
      />
    )
  }
  return (
    <div className="container-app py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Dashboard</h1>
      <p className="text-slate-600">No dashboard view for your role.</p>
    </div>
  )
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
              <ProtectedRoute>
                <DashboardByRole />
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
            path="/dashboard/instructor/:courseId/assignments"
            element={
              <ProtectedRoute requiredCapability="assignment:read:course">
                <InstructorAssignments />
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

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </Suspense>
  )
}

