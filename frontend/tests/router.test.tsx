import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'

const logoutMock = vi.fn()
const useAuthMock = vi.fn()
const usePrivacyMock = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../context/PrivacyContext', () => ({
  usePrivacy: () => usePrivacyMock(),
}))

vi.mock('../pages/Login', () => ({
  default: () => <div>Login Page</div>,
}))

vi.mock('../pages/Register', () => ({
  default: () => <div>Register Page</div>,
}))

vi.mock('../pages/PrivacyNotice', () => ({
  default: () => <div>Privacy Notice Page</div>,
}))

vi.mock('../pages/StudentDashboard', () => ({
  default: () => <div>Student Dashboard Page</div>,
}))

vi.mock('../pages/InstructorDashboardHome', () => ({
  default: () => <div>Instructor Dashboard Home Page</div>,
}))

vi.mock('../pages/InstructorDashboard', () => ({
  default: () => <div>Instructor Dashboard Page</div>,
}))

vi.mock('../pages/InstructorAssignments', () => ({
  default: () => <div>Instructor Assignments Page</div>,
}))

vi.mock('../pages/FacultyDashboard', () => ({
  default: () => <div>Faculty Dashboard Page</div>,
}))

vi.mock('../pages/AssignmentGuidance', () => ({
  default: () => <div>Assignment Guidance Page</div>,
}))

vi.mock('../pages/GuidanceManagement', () => ({
  default: () => <div>Guidance Management Page</div>,
}))

vi.mock('../pages/DeclarationSubmit', () => ({
  default: () => <div>Declaration Submit Page</div>,
}))

vi.mock('../pages/ComplianceFeedback', () => ({
  default: () => <div>Compliance Feedback Page</div>,
}))

vi.mock('../pages/PrivacySettings', () => ({
  default: () => <div>Privacy Settings Page</div>,
}))

vi.mock('../pages/DataExport', () => ({
  default: () => <div>Data Export Page</div>,
}))

vi.mock('../pages/Profile', () => ({
  default: () => <div>Profile Page</div>,
}))

import { AppRouter } from '../router.tsx'

function LocationProbe() {
  const location = useLocation()

  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  )
}

function renderRouter(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AppRouter />
      <LocationProbe />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  logoutMock.mockReset()
  useAuthMock.mockReturnValue({
    user: null,
    isLoading: false,
    logout: logoutMock,
  })
  usePrivacyMock.mockReturnValue({
    needsAcknowledgement: false,
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AppRouter', () => {
  it('shows a loading spinner while auth state is loading', () => {
    const { container } = renderRouter('/profile')

    useAuthMock.mockReturnValue({
      user: null,
      isLoading: true,
      logout: logoutMock,
    })

    cleanup()
    const rerendered = renderRouter('/profile')

    expect(rerendered.container.querySelector('.spinner')).not.toBeNull()
    expect(rerendered.container.textContent).not.toContain('Login Page')
    expect(container).toBeTruthy()
  })

  it('redirects unauthenticated users from protected routes to login', async () => {
    renderRouter('/profile')

    expect(await screen.findByText('Login Page')).toBeTruthy()
    expect(screen.getByTestId('location').textContent).toBe('/login')
  })

  it('renders public routes for signed-out users', async () => {
    renderRouter('/register')

    expect(await screen.findByText('Register Page')).toBeTruthy()
  })

  it('redirects authenticated users away from public-only routes', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'student-1', role: 'student', privacyAckVersion: 2 },
      isLoading: false,
      logout: logoutMock,
    })

    renderRouter('/login')

    expect(await screen.findByText('Student Dashboard Page')).toBeTruthy()
    expect(screen.getByTestId('location').textContent).toBe('/dashboard')
  })

  it('redirects users who still need to acknowledge privacy to the notice page', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'student-1', role: 'student', privacyAckVersion: 1 },
      isLoading: false,
      logout: logoutMock,
    })
    usePrivacyMock.mockReturnValue({
      needsAcknowledgement: true,
    })

    renderRouter('/profile')

    expect(await screen.findByText('Privacy Notice Page')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy()
    expect(screen.getByTestId('location').textContent).toBe('/privacy-notice')
  })

  it('allows users to view the privacy notice route while acknowledgement is required', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'student-1', role: 'student', privacyAckVersion: 1 },
      isLoading: false,
      logout: logoutMock,
    })
    usePrivacyMock.mockReturnValue({
      needsAcknowledgement: true,
    })

    renderRouter('/privacy-notice')

    expect(await screen.findByText('Privacy Notice Page')).toBeTruthy()
    expect(screen.getByTestId('location').textContent).toBe('/privacy-notice')
  })

  it('shows an access denied view when the user lacks the required capability', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'student-1', role: 'student', privacyAckVersion: 2 },
      isLoading: false,
      logout: logoutMock,
    })

    renderRouter('/dashboard/instructor/course-1')

    expect(await screen.findByText('Access Denied')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })

  it('renders the instructor home dashboard without a back button on /dashboard', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'instructor-1', role: 'instructor', privacyAckVersion: 2 },
      isLoading: false,
      logout: logoutMock,
    })

    renderRouter('/dashboard')

    expect(await screen.findByText('Instructor Dashboard Home Page')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
  })

  it('redirects head of faculty users to the faculty dashboard with the demo faculty id', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'faculty-1', role: 'head_of_faculty', privacyAckVersion: 2 },
      isLoading: false,
      logout: logoutMock,
    })

    renderRouter('/dashboard')

    expect(await screen.findByText('Faculty Dashboard Page')).toBeTruthy()
    expect(screen.getByTestId('location').textContent).toBe(
      '/dashboard/faculty?facultyId=11111111-1111-1111-1111-111111111111',
    )
  })

  it('shows a fallback message when the role has no dashboard view', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'admin-1', role: 'admin', privacyAckVersion: 2 },
      isLoading: false,
      logout: logoutMock,
    })

    renderRouter('/dashboard')

    expect(await screen.findByText('No dashboard view for your role.')).toBeTruthy()
  })

  it('shows a back button for non-home authenticated routes', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'student-1', role: 'student', privacyAckVersion: 2 },
      isLoading: false,
      logout: logoutMock,
    })

    renderRouter('/profile')

    expect(await screen.findByText('Profile Page')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy()
  })

  it('redirects the root path to the dashboard', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'student-1', role: 'student', privacyAckVersion: 2 },
      isLoading: false,
      logout: logoutMock,
    })

    renderRouter('/')

    expect(await screen.findByText('Student Dashboard Page')).toBeTruthy()
    expect(screen.getByTestId('location').textContent).toBe('/dashboard')
  })
})
