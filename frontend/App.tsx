import { ErrorBoundary } from './components/common/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { PrivacyProvider } from './context/PrivacyContext'
import { AppRouter } from './router'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PrivacyProvider>
          <AppRouter />
        </PrivacyProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
